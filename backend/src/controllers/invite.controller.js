import * as inviteService from '../services/invite.service.js';
import generateToken from '../utils/generateToken.js';

const COOKIE_NAME = 'token';
const COOKIE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

function getFrontendUrl() {
  return process.env.FRONTEND_URL || 'http://localhost:3001';
}

function setCookieToken(res, token) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    maxAge: COOKIE_MAX_AGE_MS,
    path: '/',
  });
}

export const createInvite = async (req, res, next) => {
  try {
    const invite = await inviteService.createInvite(req.params.id, req.user._id);
    const inviteUrl = `${getFrontendUrl()}/invite/group/${invite.token}`;
    res.status(201).json({ inviteUrl, token: invite.token, expiresAt: invite.expiresAt });
  } catch (error) {
    next(error);
  }
};

export const getInviteInfo = async (req, res, next) => {
  try {
    const info = await inviteService.getInviteByToken(req.params.token);
    res.json(info);
  } catch (error) {
    next(error);
  }
};

export const joinByInvite = async (req, res, next) => {
  try {
    const result = await inviteService.joinByInvite(req.params.token, req.user._id);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const registerAndJoin = async (req, res, next) => {
  try {
    const { email, password, fullName } = req.body;
    if (!email || !password || !fullName) {
      return res.status(400).json({ message: "Email, пароль та ім'я обов'язкові" });
    }

    const { user, groupId, groupName } = await inviteService.registerAndJoin(
      req.params.token,
      { email, password, fullName },
    );

    const jwtToken = generateToken(user._id, user.tokenVersion ?? 0);
    setCookieToken(res, jwtToken);

    res.status(201).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      groupId,
      groupName,
    });
  } catch (error) {
    next(error);
  }
};
