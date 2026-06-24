import { WebSocketServer } from 'ws';
import jwt from 'jsonwebtoken';
import Group from '../../models/Group.js';
import User from '../../models/User.js';
import * as groupChatService from './groupChat.service.js';

// groupId (string) -> Set<WebSocket>
const rooms = new Map();

function broadcast(groupId, payload, exclude = null) {
  const room = rooms.get(groupId);
  if (!room) return;
  const data = JSON.stringify(payload);
  for (const client of room) {
    if (client !== exclude && client.readyState === 1) {
      client.send(data);
    }
  }
}

function parseCookies(header = '') {
  return Object.fromEntries(
    header
      .split(';')
      .map((c) => c.trim().split('='))
      .filter((p) => p.length >= 2)
      .map(([k, ...v]) => [k.trim(), decodeURIComponent(v.join('=').trim())]),
  );
}

async function authenticateFromToken(ws, token) {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  ws.userId = String(decoded.id || decoded._id);

  const [asSuper, asMember] = await Promise.all([
    Group.find({ supervisorId: ws.userId, status: 'active' })
      .select('_id')
      .lean(),
    Group.find({
      'members.userId': ws.userId,
      'members.status': 'active',
      status: 'active',
    })
      .select('_id')
      .lean(),
  ]);

  ws.groupIds = [
    ...new Set([
      ...asSuper.map((g) => String(g._id)),
      ...asMember.map((g) => String(g._id)),
    ]),
  ];

  for (const gid of ws.groupIds) {
    if (!rooms.has(gid)) rooms.set(gid, new Set());
    rooms.get(gid).add(ws);
  }

  ws.send(
    JSON.stringify({ type: 'auth.ok', userId: ws.userId, rooms: ws.groupIds }),
  );
}

export function attachGroupChatWS(httpServer) {
  const wss = new WebSocketServer({ server: httpServer, path: '/ws/chat' });

  wss.on('connection', async (ws, req) => {
    ws.userId = null;
    ws.groupIds = [];
    ws.isAlive = true;

    // Cookie-based auth on connect — JWT is in httpOnly cookie, not accessible from JS
    const cookies = parseCookies(req.headers.cookie);
    if (cookies.token) {
      try {
        await authenticateFromToken(ws, cookies.token);
      } catch {
        // Invalid or expired cookie — client can retry via auth message
      }
    }

    ws.on('pong', () => {
      ws.isAlive = true;
    });

    ws.on('message', async (raw) => {
      let msg;
      try {
        msg = JSON.parse(raw.toString());
      } catch {
        return;
      }

      // ── auth (fallback for non-cookie clients) ───────────────────────────────
      if (msg.type === 'auth') {
        if (ws.userId) {
          // Already authenticated via cookie — just confirm
          ws.send(
            JSON.stringify({
              type: 'auth.ok',
              userId: ws.userId,
              rooms: ws.groupIds,
            }),
          );
          return;
        }
        try {
          await authenticateFromToken(ws, msg.token);
        } catch {
          ws.send(
            JSON.stringify({ type: 'auth.error', reason: 'Invalid token' }),
          );
          ws.close();
        }
        return;
      }

      if (!ws.userId) {
        ws.send(JSON.stringify({ type: 'error', reason: 'Not authenticated' }));
        return;
      }

      // ── message.send ────────────────────────────────────────────────────────
      if (msg.type === 'message.send') {
        const { groupId, text, optimisticId } = msg;

        if (!ws.groupIds.includes(groupId)) {
          ws.send(
            JSON.stringify({
              type: 'error',
              reason: 'Not authorized for this room',
            }),
          );
          return;
        }

        const trimmed = (text ?? '').trim();
        if (!trimmed || trimmed.length > 4000) return;

        const user = await User.findById(ws.userId).select('fullName').lean();
        const senderName = user?.fullName ?? 'Unknown';

        const saved = await groupChatService.saveMessage(
          groupId,
          ws.userId,
          senderName,
          trimmed,
        );

        const msgPayload = {
          _id: String(saved._id),
          senderId: ws.userId,
          senderName,
          text: saved.text,
          createdAt: saved.createdAt.toISOString(),
        };

        // Sender gets ack, others get message.new
        ws.send(
          JSON.stringify({
            type: 'message.ack',
            groupId,
            message: msgPayload,
            optimisticId,
          }),
        );
        broadcast(
          groupId,
          { type: 'message.new', groupId, message: msgPayload },
          ws,
        );
        return;
      }

      // ── typing ──────────────────────────────────────────────────────────────
      if (msg.type === 'typing.start' || msg.type === 'typing.stop') {
        const { groupId } = msg;
        if (!ws.groupIds.includes(groupId)) return;
        broadcast(groupId, { type: msg.type, groupId, userId: ws.userId }, ws);
      }
    });

    ws.on('close', () => {
      for (const gid of ws.groupIds) {
        rooms.get(gid)?.delete(ws);
      }
    });

    ws.on('error', () => {
      ws.close();
    });
  });

  // Heartbeat — detect stale connections
  const heartbeat = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (!ws.isAlive) {
        ws.terminate();
        return;
      }
      ws.isAlive = false;
      ws.ping();
    });
  }, 30_000);

  wss.on('close', () => clearInterval(heartbeat));

  console.log('[group-chat] WebSocket server attached at /ws/chat');
}
