import axios from 'axios';
import jwt from 'jsonwebtoken';

const GOOGLE_AUTH_BASE = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const DEFAULT_SCOPES = ['https://www.googleapis.com/auth/gmail.modify'];

function getEnv(name) {
  const value = process.env[name];
  return typeof value === 'string' ? value.trim() : '';
}

export function getGmailOauthConfig() {
  const clientId = getEnv('GOOGLE_GMAIL_CLIENT_ID');
  const clientSecret = getEnv('GOOGLE_GMAIL_CLIENT_SECRET');
  const redirectUri = getEnv('GOOGLE_GMAIL_REDIRECT_URI');
  const rawScopes = getEnv('GOOGLE_GMAIL_SCOPES');
  const scopes = rawScopes
    ? rawScopes
        .split(',')
        .map((scope) => scope.trim())
        .filter(Boolean)
    : DEFAULT_SCOPES;

  return {
    clientId,
    clientSecret,
    redirectUri,
    scopes,
    configured: Boolean(clientId && clientSecret && redirectUri),
  };
}

export function createConnectState({ actorEmail, returnTo }) {
  return jwt.sign(
    {
      type: 'gmail-connect',
      actorEmail,
      returnTo,
    },
    process.env.JWT_SECRET,
    { expiresIn: '15m' },
  );
}

export function readConnectState(stateToken) {
  const decoded = jwt.verify(stateToken, process.env.JWT_SECRET);
  if (!decoded || decoded.type !== 'gmail-connect') {
    throw Object.assign(new Error('Invalid Gmail OAuth state'), {
      status: 400,
    });
  }
  return decoded;
}

export function buildConnectUrl({ actorEmail, returnTo }) {
  const config = getGmailOauthConfig();
  if (!config.configured) {
    throw Object.assign(new Error('Gmail OAuth is not configured'), {
      status: 503,
    });
  }

  const state = createConnectState({ actorEmail, returnTo });
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: 'true',
    scope: config.scopes.join(' '),
    state,
  });

  return `${GOOGLE_AUTH_BASE}?${params.toString()}`;
}

export async function exchangeCodeForTokens(code) {
  const config = getGmailOauthConfig();
  if (!config.configured) {
    throw Object.assign(new Error('Gmail OAuth is not configured'), {
      status: 503,
    });
  }

  const body = new URLSearchParams({
    code,
    client_id: config.clientId,
    client_secret: config.clientSecret,
    redirect_uri: config.redirectUri,
    grant_type: 'authorization_code',
  });

  const { data } = await axios.post(GOOGLE_TOKEN_URL, body.toString(), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });

  return data;
}

export async function refreshAccessToken(refreshToken) {
  const config = getGmailOauthConfig();
  if (!config.configured) {
    throw Object.assign(new Error('Gmail OAuth is not configured'), {
      status: 503,
    });
  }
  if (!refreshToken) {
    throw Object.assign(new Error('No Gmail refresh token available'), {
      status: 400,
    });
  }

  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  });

  const { data } = await axios.post(GOOGLE_TOKEN_URL, body.toString(), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });

  return data;
}
