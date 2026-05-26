import Taxonomy from '../models/Taxonomy.js';
import Law from '../models/Law.js';
import Element from '../models/Element.js';
import { classifyElement } from '../services/taxonomyService.js';

export const getAllTaxonomies = async (req, res, next) => {
  try {
    const taxonomies = await Taxonomy.find().sort({ name: 1 }).lean();
    res.json(taxonomies);
  } catch (error) {
    next(error);
  }
};

export const getTaxonomyTree = async (req, res, next) => {
  try {
    const taxonomies = await Taxonomy.find().lean();

    const buildTree = (items, parentId = null) => {
      return items
        .filter(
          (item) => String(item.parentId || null) === String(parentId || null),
        )
        .map((item) => ({
          ...item,
          children: buildTree(items, item._id),
        }));
    };

    const tree = buildTree(taxonomies);
    res.json(tree);
  } catch (error) {
    next(error);
  }
};

export const analyzeLaw = async (req, res, next) => {
  try {
    const { lawId } = req.params;
    const law = await Law.findById(lawId);
    if (!law) return res.status(404).json({ message: 'Law not found' });

    const elements = await Element.find({ lawId });
    if (!elements || elements.length === 0) {
      return res
        .status(404)
        .json({ message: 'No elements found for this law' });
    }

    const bulkOps = elements.map((el) => {
      const taxonomy = classifyElement(el);
      return {
        updateOne: {
          filter: { _id: el._id },
          update: { $set: { taxonomy } },
        },
      };
    });

    await Element.bulkWrite(bulkOps);

    res.json({
      message: 'Law elements analyzed successfully',
      analyzedCount: elements.length,
    });
  } catch (error) {
    next(error);
  }
};
