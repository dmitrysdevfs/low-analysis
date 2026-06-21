import GraphFork from '../models/GraphFork.js';

export async function createFork(req, res) {
  try {
    const { name, description, viewState, filters, pathState, isPublic } = req.body;
    if (!name?.trim()) {
      return res.status(400).json({ error: 'name is required' });
    }
    const fork = await GraphFork.create({
      userId: req.user._id,
      name: name.trim(),
      description: description ?? '',
      viewState: viewState ?? {},
      filters: filters ?? {},
      pathState: pathState ?? {},
      isPublic: isPublic ?? false,
    });
    return res.status(201).json(fork);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

export async function getMyForks(req, res) {
  try {
    const forks = await GraphFork.find({ userId: req.user._id })
      .sort({ updatedAt: -1 })
      .limit(50)
      .lean();
    return res.status(200).json(forks);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

export async function getForkById(req, res) {
  try {
    const fork = await GraphFork.findById(req.params.id).lean();
    if (!fork) return res.status(404).json({ error: 'Fork not found' });
    // публічний або власний
    if (!fork.isPublic && fork.userId.toString() !== req.user?._id?.toString()) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    return res.status(200).json(fork);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

export async function updateFork(req, res) {
  try {
    const fork = await GraphFork.findOne({ _id: req.params.id, userId: req.user._id });
    if (!fork) return res.status(404).json({ error: 'Fork not found or not yours' });
    const { name, description, viewState, filters, pathState, isPublic } = req.body;
    if (name !== undefined) fork.name = name.trim();
    if (description !== undefined) fork.description = description;
    if (viewState !== undefined) fork.viewState = viewState;
    if (filters !== undefined) fork.filters = filters;
    if (pathState !== undefined) fork.pathState = pathState;
    if (isPublic !== undefined) fork.isPublic = isPublic;
    await fork.save();
    return res.status(200).json(fork);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

export async function deleteFork(req, res) {
  try {
    const fork = await GraphFork.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!fork) return res.status(404).json({ error: 'Fork not found or not yours' });
    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
