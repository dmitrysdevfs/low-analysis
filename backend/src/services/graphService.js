import mongoose from 'mongoose';
import Law from '../models/Law.js';
import LawReference from '../models/LawReference.js';

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
    });
  }

  return { nodes, edges };
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
      },
    },
  ]);

  const edges = aggregated.map((item) => ({
    id: `${item._id.fromLaw}-${item._id.toLaw}`,
    source: item._id.fromLaw.toString(),
    target: item._id.toLaw.toString(),
    type: item.type,
    weight: item.count,
  }));

  return { nodes, edges };
}
