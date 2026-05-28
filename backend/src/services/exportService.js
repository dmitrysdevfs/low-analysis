import Law from '../models/Law.js';
import Element from '../models/Element.js';

/**
 * Builds a flat array representing legislative paragraphs with full parent hierarchy,
 * subjects, roles, risk levels, and statistics.
 *
 * @param {string} lawId - The ObjectId of the Law to export.
 * @param {object} filters - Optional query filters (e.g., subject).
 * @returns {Promise<object[]>} Flat dataset of law elements.
 */
export async function getFlatDataset(lawId, filters = {}) {
  const law = await Law.findById(lawId);
  if (!law) {
    throw new Error(`Law not found with ID: ${lawId}`);
  }

  // Fetch all elements for this law to reconstruct hierarchy in memory
  const elements = await Element.find({ lawId })
    .populate('subjects.subject_id')
    .sort({ order: 1 });

  // Map to easily access elements by ID
  const elementMap = new Map(elements.map((el) => [el._id.toString(), el]));

  // Helper to find parent elements of specific types
  const findAncestor = (element, type) => {
    let current = element;
    while (current && current.parentId) {
      const parent = elementMap.get(current.parentId.toString());
      if (!parent) break;
      if (parent.type === type) return parent;
      current = parent;
    }
    return null;
  };

  // Apply date range filters if specified
  const start = filters.startDate || filters.dateFrom;
  const end = filters.endDate || filters.dateTo;
  if (start || end) {
    if (!law.adoptedDate) {
      return [];
    }
    const adopted = new Date(law.adoptedDate);
    if (start && adopted < new Date(start)) {
      return [];
    }
    if (end && adopted > new Date(end)) {
      return [];
    }
  }

  // Filter elements to get only leaf text elements (or any containing text)
  // Typically sections/articles are structural and do not have text of their own.
  let targetElements = elements.filter(
    (el) => el.text && el.type !== 'section' && el.type !== 'article',
  );

  // Apply subject filter if specified
  if (filters.subject) {
    const subjQuery = String(filters.subject).toLowerCase();
    targetElements = targetElements.filter((el) =>
      el.subjects.some((s) => {
        const subject = s.subject_id;
        if (!subject) return false;
        return (
          subject._id.toString() === subjQuery ||
          subject.canonical_name.toLowerCase().includes(subjQuery)
        );
      }),
    );
  }

  // Apply article filter if specified
  if (filters.article) {
    const articleNum = String(filters.article).trim();
    targetElements = targetElements.filter((el) => {
      const article = findAncestor(el, 'article');
      return article && String(article.number).trim() === articleNum;
    });
  }

  // Build flat rows
  const dataset = targetElements.map((el) => {
    const section = findAncestor(el, 'section');
    const article = findAncestor(el, 'article');

    const detectedSubjects = el.subjects
      .map((s) => s.subject_id?.canonical_name)
      .filter(Boolean);

    const regulators = el.subjects
      .filter(
        (s) => s.role === 'regulator' || s.role === 'issuer_of_regulations',
      )
      .map((s) => s.subject_id?.canonical_name)
      .filter(Boolean);

    const subjectAliases = [
      ...new Set(
        el.subjects.flatMap((s) => s.subject_id?.aliases || []).filter(Boolean),
      ),
    ];

    return {
      law_id: law._id.toString(),
      law_number: law.code,
      law_title: law.title,
      law_type: law.type || 'unknown',
      adoption_date: law.adoptedDate ? law.adoptedDate.toISOString() : null,
      section_number: section ? section.number : '',
      section_title: section ? section.title || '' : '',
      article_number: article ? article.number : '',
      article_title: article ? article.title || '' : '',
      paragraph_number: el.number || '',
      paragraph_text: el.text || '',
      element_code: el.code,
      detected_subjects: detectedSubjects.join('; '),
      regulators: regulators.join('; '),
      subject_aliases: subjectAliases.join('; '),
      risk_level: el.risk_level || 'none',
      z_score: Number(el.z_score || 0).toFixed(2),
    };
  });

  return dataset;
}

/**
 * Builds a structured nested tree of the law with embedded subjects, roles, and statistics.
 *
 * @param {string} lawId - The ObjectId of the Law to export.
 * @param {object} filters - Optional query filters (e.g., subject).
 * @returns {Promise<object>} Nested tree representation of the law.
 */
export async function getNestedDataset(lawId, filters = {}) {
  const law = await Law.findById(lawId);
  if (!law) {
    throw new Error(`Law not found with ID: ${lawId}`);
  }

  // Apply date range filters if specified
  const start = filters.startDate || filters.dateFrom;
  const end = filters.endDate || filters.dateTo;
  if (start || end) {
    if (!law.adoptedDate) {
      return null;
    }
    const adopted = new Date(law.adoptedDate);
    if (start && adopted < new Date(start)) {
      return null;
    }
    if (end && adopted > new Date(end)) {
      return null;
    }
  }

  // Fetch all elements for this law
  const elements = await Element.find({ lawId })
    .populate('subjects.subject_id')
    .sort({ order: 1 });

  // Map to build the tree hierarchy
  const elementMap = new Map();
  elements.forEach((el) => {
    const rawEl = el.toObject();
    rawEl.children = [];
    // Convert Mongoose populated subjects into a cleaner format
    rawEl.subjects = (rawEl.subjects || []).map((s) => ({
      name: s.subject_id?.canonical_name || 'unknown',
      role: s.role,
      legal_status: s.subject_id?.legal_status || 'other',
      aliases: s.subject_id?.aliases || [],
    }));
    elementMap.set(rawEl._id.toString(), rawEl);
  });

  const rootNodes = [];

  elementMap.forEach((el) => {
    if (el.parentId) {
      const parent = elementMap.get(el.parentId.toString());
      if (parent) {
        parent.children.push(el);
      } else {
        rootNodes.push(el);
      }
    } else {
      rootNodes.push(el);
    }
  });

  let filteredRootNodes = rootNodes;

  // Apply article filter if specified
  if (filters.article) {
    const articleNum = String(filters.article).trim();
    const keepArticleNode = (node) => {
      if (
        node.type === 'article' &&
        String(node.number).trim() === articleNum
      ) {
        return true;
      }
      node.children = node.children.filter(keepArticleNode);
      return node.children.length > 0;
    };
    filteredRootNodes = filteredRootNodes.filter(keepArticleNode);
  }

  // Apply subject filter if specified
  if (filters.subject) {
    const subjQuery = String(filters.subject).toLowerCase();
    const pruneTree = (node) => {
      const nodeMatches = node.subjects?.some(
        (s) =>
          s.name.toLowerCase().includes(subjQuery) ||
          s.aliases?.some((a) => a.toLowerCase().includes(subjQuery)),
      );
      node.children = node.children.filter(pruneTree);
      return nodeMatches || node.children.length > 0;
    };
    filteredRootNodes = filteredRootNodes.filter(pruneTree);
  }

  return {
    _id: law._id.toString(),
    title: law.title,
    code: law.code,
    type: law.type || 'unknown',
    adoptedDate: law.adoptedDate ? law.adoptedDate.toISOString() : null,
    children: filteredRootNodes,
  };
}
