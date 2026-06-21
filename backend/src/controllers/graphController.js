import mongoose from 'mongoose';
import { getGraphForLaw, getGlobalGraph, getGraphSubjects } from '../services/graphService.js';
import LawReference from '../models/LawReference.js';

export async function getLawGraph(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid lawId' });
    }

    const depth = Math.min(parseInt(req.query.depth, 10) || 1, 3);

    const { nodes, edges } = await getGraphForLaw(id, depth);

    return res.status(200).json({
      nodes,
      edges,
      meta: { generatedAt: new Date() },
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

export async function getGlobalGraphHandler(req, res) {
  try {
    const { nodes, edges } = await getGlobalGraph();

    return res.status(200).json({
      nodes,
      edges,
      meta: { generatedAt: new Date() },
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

export async function getGraphSubjectsHandler(req, res) {
  try {
    const subjects = await getGraphSubjects();
    return res.status(200).json({ subjects });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

export async function getGraphPath(req, res) {
  try {
    const { from, to } = req.query;

    if (!from || !to) {
      return res
        .status(400)
        .json({ error: 'Query params "from" and "to" are required' });
    }

    if (
      !mongoose.Types.ObjectId.isValid(from) ||
      !mongoose.Types.ObjectId.isValid(to)
    ) {
      return res.status(400).json({ error: 'Invalid "from" or "to" ObjectId' });
    }

    if (from === to) {
      return res.status(200).json({ path: [from], hops: 0 });
    }

    // BFS через LawReference collection
    const visited = new Set();
    const queue = [{ id: from, path: [from] }];
    visited.add(from);

    while (queue.length > 0) {
      const { id: current, path } = queue.shift();

      const refs = await LawReference.find(
        {
          $or: [
            { fromLaw: new mongoose.Types.ObjectId(current) },
            { toLaw: new mongoose.Types.ObjectId(current) },
          ],
          toLaw: { $ne: null },
        },
        'fromLaw toLaw',
      ).lean();

      for (const ref of refs) {
        const neighborId =
          ref.fromLaw.toString() === current
            ? ref.toLaw.toString()
            : ref.fromLaw.toString();

        if (neighborId === to) {
          const finalPath = [...path, neighborId];
          return res.status(200).json({
            path: finalPath,
            hops: finalPath.length - 1,
          });
        }

        if (!visited.has(neighborId)) {
          visited.add(neighborId);
          queue.push({ id: neighborId, path: [...path, neighborId] });
        }
      }
    }

    return res
      .status(404)
      .json({ error: 'No path found between the given laws' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
