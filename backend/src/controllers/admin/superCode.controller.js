import * as superCodeService from '../../services/admin/superCode.service.js';

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.ip || req.socket?.remoteAddress || null;
}

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
    const result = await superCodeService.rotateCode(actor, getClientIp(req));
    res.json(result);
  } catch (err) {
    next(err);
  }
};
