import {
  parseReferencesForAllLaws,
  parseReferencesForLaw,
} from '../../services/referenceParser.js';
import mongoose from 'mongoose';

export async function parseAllReferences(req, res) {
  try {
    const results = await parseReferencesForAllLaws();
    const totalCreated = results.reduce((s, r) => s + r.created, 0);
    const totalUpdated = results.reduce((s, r) => s + r.updated, 0);
    const totalParsed = results.reduce((s, r) => s + r.parsed, 0);
    return res.status(200).json({
      laws: results.length,
      totalParsed,
      totalCreated,
      totalUpdated,
      results,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

export async function parseSingleLawReferences(req, res) {
  try {
    const { lawId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(lawId)) {
      return res.status(400).json({ error: 'Invalid lawId' });
    }
    const result = await parseReferencesForLaw(
      new mongoose.Types.ObjectId(lawId),
    );
    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
