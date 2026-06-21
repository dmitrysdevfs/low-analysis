import mongoose from 'mongoose';
import Law from '../models/Law.js';
import LawReference from '../models/LawReference.js';
import Element from '../models/Element.js';

export async function getGraphForLaw(lawId, depth = 1) {
  const lawObjectId = new mongoose.Types.ObjectId(lawId);

  const firstLevelRefs = await LawReference.find({
    $or: [{ fromLaw: lawObjectId }, { toLaw: lawObjectId }],
  }).lean();

  const neighborIds = new Set();
  neighborIds.add(lawId.toString());

  for (const ref of firstLevelRefs) {
    if (ref.fromLaw) neighborIds.add(ref.fromLaw.toString());
    if (ref.toLaw) neighborIds.add(ref.toLaw.toString());
  }

  let allRefs = [...firstLevelRefs];

  if (depth >= 2) {
    const firstLevelNeighbors = [...neighborIds].filter(
      (id) => id !== lawId.toString(),
    );

    for (const neighborId of firstLevelNeighbors) {
      const neighborObjectId = new mongoose.Types.ObjectId(neighborId);
      const neighborRefs = await LawReference.find({
        $or: [{ fromLaw: neighborObjectId }, { toLaw: neighborObjectId }],
      }).lean();

      for (const ref of neighborRefs) {
        if (ref.fromLaw) neighborIds.add(ref.fromLaw.toString());
        if (ref.toLaw) neighborIds.add(ref.toLaw.toString());
        allRefs.push(ref);
      }
    }
  }

  const uniqueLawIds = [...neighborIds]
    .filter(Boolean)
    .map((id) => new mongoose.Types.ObjectId(id));

  const laws = await Law.find(
    { _id: { $in: uniqueLawIds } },
    '_id title code documentType totalArticles',
  ).lean();

  const nodes = laws.map((law) => ({
    id: law._id.toString(),
    label: law.title,
    type: (law.documentType && law.documentType[0]) || 'law',
    totalArticles: law.totalArticles,
    code: law.code,
  }));

  const seenEdges = new Set();
  const edges = [];

  for (const ref of allRefs) {
    if (!ref.toLaw) continue;
    const edgeKey = `${ref._id.toString()}`;
    if (seenEdges.has(edgeKey)) continue;
    seenEdges.add(edgeKey);

    edges.push({
      id: ref._id.toString(),
      source: ref.fromLaw.toString(),
      target: ref.toLaw.toString(),
      type: ref.type,
      confidence: ref.confidence,
      fromArticle: ref.fromArticle ?? null,
      toArticle: ref.toArticle ?? null,
      rawText: ref.rawText ?? null,
    });
  }

  return { nodes, edges };
}

export async function getGraphSubjects() {
  const agg = await Element.aggregate([
    { $match: { 'subjects.0': { $exists: true } } },
    { $unwind: '$subjects' },
    {
      $group: {
        _id: '$subjects.subject_id',
        count: { $sum: 1 },
        lawIds: { $addToSet: '$lawId' },
      },
    },
    { $sort: { count: -1 } },
    {
      $lookup: {
        from: 'subjects',
        localField: '_id',
        foreignField: '_id',
        as: 'subjectDoc',
      },
    },
    { $unwind: '$subjectDoc' },
    {
      $project: {
        _id: 1,
        name: '$subjectDoc.canonical_name',
        count: 1,
        lawIds: 1,
      },
    },
  ]);

  return agg.map((s) => ({
    _id: s._id.toString(),
    name: s.name ?? 'Невідомий суб\'єкт',
    count: s.count,
    lawIds: s.lawIds.map((id) => id.toString()),
  }));
}

export async function getGlobalGraph() {
  const laws = await Law.find(
    {},
    '_id title code documentType totalArticles',
  ).lean();

  const nodes = laws.map((law) => ({
    id: law._id.toString(),
    label: law.title,
    type: (law.documentType && law.documentType[0]) || 'law',
    totalArticles: law.totalArticles,
    code: law.code,
  }));

  const aggregated = await LawReference.aggregate([
    {
      $match: {
        toLaw: { $ne: null },
      },
    },
    {
      $group: {
        _id: { fromLaw: '$fromLaw', toLaw: '$toLaw' },
        count: { $sum: 1 },
        type: { $first: '$type' },
        avgConfidence: { $avg: '$confidence' },
      },
    },
  ]);

  const edges = aggregated.map((item) => ({
    id: `${item._id.fromLaw}-${item._id.toLaw}`,
    source: item._id.fromLaw.toString(),
    target: item._id.toLaw.toString(),
    type: item.type,
    confidence: item.avgConfidence ?? 0.7,
    weight: item.count,
    fromArticle: null,
    toArticle: null,
    rawText: null,
  }));

  return { nodes, edges };
}
