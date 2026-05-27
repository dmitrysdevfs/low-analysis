import RoadmapDoc from './roadmap.model.js';
import { ROADMAP_DOC_ID } from './roadmap.constants.js';
import { DEFAULT_ROADMAP_CONTENT } from './roadmap.defaults.js';

function toPayload(doc) {
  return {
    phases: doc.phases,
    roadmapItems: doc.roadmapItems,
    deferredItems: doc.deferredItems,
    decisions: doc.decisions,
    updatedAt: doc.updatedAt,
  };
}

async function getOrCreate() {
  let doc = await RoadmapDoc.findById(ROADMAP_DOC_ID);

  if (!doc) {
    doc = await RoadmapDoc.create({
      _id: ROADMAP_DOC_ID,
      ...DEFAULT_ROADMAP_CONTENT,
    });
  }

  return doc;
}

export async function getRoadmap() {
  const doc = await getOrCreate();
  return toPayload(doc);
}

export async function updateRoadmap(content, userId = null) {
  const doc = await getOrCreate();

  if (content.phases !== undefined) doc.phases = content.phases;
  if (content.roadmapItems !== undefined)
    doc.roadmapItems = content.roadmapItems;
  if (content.deferredItems !== undefined)
    doc.deferredItems = content.deferredItems;
  if (content.decisions !== undefined) doc.decisions = content.decisions;
  doc.updatedBy = userId;

  await doc.save();
  return toPayload(doc);
}
