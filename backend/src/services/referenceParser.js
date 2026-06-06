import Element from '../models/Element.js';
import Law from '../models/Law.js';
import LawReference from '../models/LawReference.js';

export async function parseReferencesForLaw(lawId) {
  const elements = await Element.find({
    lawId,
    type: { $in: ['article', 'part', 'point'] },
    text: { $exists: true, $ne: '' },
  }).lean();

  let parsed = 0;
  let created = 0;
  let updated = 0;

  for (const element of elements) {
    const { text, number: fromArticle } = element;
    const refs = [];

    // Рефлексивні посилання: стаття X цього Закону/Кодексу
    const reflexiveRegex =
      /статт[іяю]\s+(\d+(?:[,\s]+\d+)*)\s+(?:цього\s+)?(?:Закону|Кодексу)/gi;
    let match;
    while ((match = reflexiveRegex.exec(text)) !== null) {
      refs.push({
        type: 'reflexive',
        toArticle: match[1].trim(),
        toLawTitle: null,
        rawText: match[0],
      });
    }

    // Прямі посилання: Закону України «...»
    const directTitleRegex = /Закону\s+України\s+[«"](.*?)[»"]/gi;
    while ((match = directTitleRegex.exec(text)) !== null) {
      refs.push({
        type: 'direct',
        toLawTitle: match[1].trim(),
        toArticle: null,
        rawText: match[0],
      });
    }

    // Відповідно до статті X Закону/Кодексу ...
    const directArticleRegex =
      /відповідно до\s+(?:статті\s+(\d+)\s+)?(?:Закону|Кодексу)\s+([^,.;]+)/gi;
    while ((match = directArticleRegex.exec(text)) !== null) {
      refs.push({
        type: 'direct',
        toArticle: match[1] ? match[1].trim() : null,
        toLawTitle: match[2] ? match[2].trim() : null,
        rawText: match[0],
      });
    }

    // Бланкетні: порядок визначається законом/цим Законом
    const blanketRegex =
      /порядок[^.]*?визначається\s+(?:законом|цим Законом)/gi;
    while ((match = blanketRegex.exec(text)) !== null) {
      refs.push({
        type: 'blanket',
        toLawTitle: null,
        toArticle: null,
        rawText: match[0],
      });
    }

    parsed += refs.length;

    for (const ref of refs) {
      let toLawId = null;

      if (ref.toLawTitle) {
        const foundLaw = await Law.findOne({
          title: { $regex: ref.toLawTitle, $options: 'i' },
        }).lean();
        if (foundLaw) {
          toLawId = foundLaw._id;
        }
      }

      const filter = {
        fromLaw: lawId,
        fromArticle: fromArticle || null,
        toLawTitle: ref.toLawTitle || null,
      };

      const update = {
        fromLaw: lawId,
        fromArticle: fromArticle || null,
        toLaw: toLawId,
        toLawTitle: ref.toLawTitle || null,
        toArticle: ref.toArticle || null,
        type: ref.type,
        rawText: ref.rawText,
        confidence: 0.7,
      };

      const result = await LawReference.findOneAndUpdate(filter, update, {
        upsert: true,
        new: false,
      });

      if (result) {
        updated++;
      } else {
        created++;
      }
    }
  }

  return { parsed, created, updated };
}

export async function parseReferencesForAllLaws() {
  const laws = await Law.find({}, '_id').lean();
  const results = [];

  for (const law of laws) {
    const result = await parseReferencesForLaw(law._id);
    results.push({ lawId: law._id, ...result });
  }

  return results;
}
