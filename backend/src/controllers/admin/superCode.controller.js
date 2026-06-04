import * as superCodeService from '../../services/admin/superCode.service.js';

export const getSuperCode = async (req, res, next) => {
  try {
    const [code, history] = await Promise.all([
      superCodeService.getActiveCode(),
      superCodeService.getCodeHistory(),
    ]);
    res.json({ activeSuperCode: code, superCodeHistory: history });
  } catch (err) {
    next(err);
  }
};

export const rotateSuperCode = async (req, res, next) => {
  try {
    const actor = req.user?.email ?? 'admin';
    const result = await superCodeService.rotateCode(actor);
    res.json(result);
  } catch (err) {
    next(err);
  }
};
