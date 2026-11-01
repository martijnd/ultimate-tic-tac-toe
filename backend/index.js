// Server for ultimate-tic-tac-toe. Each room (the session code in the URL) holds at most
// two players: the first is X, the second is O. It relays moves and remembers them so
// players can reconnect.
const { createServer } = require('http');
const { Server } = require('socket.io');

const PORT = process.env.PORT || 5001;
const ORIGINS = (process.env.ALLOWED_ORIGINS || 'https://ultimatetictactoe.x4d.nl,https://ultimate-tic-tac-toe-xi.vercel.app,http://localhost:3000,http://localhost:5173')
  .split(',');

const httpServer = createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('ok');
});
// ALLOW_LAN=1 (used by `npm run dev:host`) also allows localhost and private-network
// origins such as http://192.168.1.82:3000, so other devices can reach a dev server.
const LAN_ORIGIN = /^https?:\/\/(localhost|127\.0\.0\.1|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)(:\d+)?$/;
const allowOrigin = (origin, callback) => {
  const ok = !origin || ORIGINS.includes(origin) || (process.env.ALLOW_LAN === '1' && LAN_ORIGIN.test(origin));
  callback(null, ok);
};

// Keep in sync with frontend/src/reactions.ts
const REACTIONS = ['👏', '😂', '😮', '😬', '🔥'];
const REACTION_COOLDOWN_MS = 400;

// Faster heartbeat than the default (25s + 20s), so a player whose connection silently dies
// shows as offline to the other player within about 15 seconds.
const io = new Server(httpServer, { cors: { origin: allowOrigin }, pingInterval: 10000, pingTimeout: 5000 });

// Room state lives in memory: who holds which seat, and the moves of every game so far.
// A player who drops (refresh, flaky network, phone asleep) rejoins with the same token,
// gets their seat back and receives the moves to rebuild the board.
// A server restart forgets everything; that's fine for a casual game.
const ROOM_TTL_MS = 30 * 60 * 1000; // forget a room once both players have been gone this long
const rooms = new Map();
const other = (player) => (player === 'X' ? 'O' : 'X');
const isIndex = (n) => Number.isInteger(n) && n >= 0 && n <= 8;
const randomToken = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

function getRoom(code) {
  let room = rooms.get(code);
  if (!room) {
    room = { seats: { X: null, O: null }, games: [[]], rematch: { X: false, O: false }, cleanup: null };
    rooms.set(code, room);
  }
  return room;
}

function scheduleCleanup(code, room) {
  if (room.seats.X?.socketId || room.seats.O?.socketId) return;
  clearTimeout(room.cleanup);
  room.cleanup = setTimeout(() => rooms.delete(code), ROOM_TTL_MS);
}

io.on('connection', (socket) => {
  socket.on('join', ({ code, token } = {}) => {
    if (!code || typeof code !== 'string' || code.length > 64) return;
    // Older clients send no token; they simply can't reclaim a seat.
    if (typeof token !== 'string' || !token || token.length > 64) token = randomToken();

    const room = getRoom(code);
    let player = ['X', 'O'].find(p => room.seats[p]?.token === token);
    const returning = Boolean(player);
    if (!player) {
      player = !room.seats.X ? 'X' : !room.seats.O ? 'O' : null;
      if (!player) {
        socket.emit('full');
        return;
      }
      room.seats[player] = { token, socketId: null };
    }

    // The same seat opened somewhere else (e.g. a duplicated tab): the newest one wins.
    const seat = room.seats[player];
    if (seat.socketId && seat.socketId !== socket.id) {
      const previous = io.sockets.sockets.get(seat.socketId);
      previous?.emit('replaced');
      previous?.disconnect(true);
    }
    seat.socketId = socket.id;
    clearTimeout(room.cleanup);

    socket.data.code = code;
    socket.data.player = player;
    socket.join(code);

    const opponent = room.seats[other(player)];
    socket.emit('accepted', player);
    socket.emit('resume', {
      player,
      games: room.games,
      rematch: room.rematch,
      otherJoined: Boolean(opponent),
      otherOnline: Boolean(opponent?.socketId),
    });

    if (returning) socket.to(code).emit('opponent-online');
    else if (opponent) io.to(code).emit('player-accepted');
  });

  socket.on('place-mark', (payload = {}) => {
    const { code, player } = socket.data;
    const room = rooms.get(code);
    if (!room || payload.code !== code || payload.player !== player) return;
    if (!isIndex(payload.boardIndex) || !isIndex(payload.cellIndex)) return;
    room.games[room.games.length - 1].push({ boardIndex: payload.boardIndex, cellIndex: payload.cellIndex, player });
    socket.to(code).emit('place-mark', { code, boardIndex: payload.boardIndex, cellIndex: payload.cellIndex, player });
  });

  // "Play again" pressed; the next game starts once both players have sent it.
  socket.on('rematch', (payload = {}) => {
    const { code, player } = socket.data;
    const room = rooms.get(code);
    if (!room || payload.code !== code) return;
    room.rematch[player] = true;
    if (room.rematch.X && room.rematch.O) {
      room.games.push([]);
      room.rematch = { X: false, O: false };
    }
    socket.to(code).emit('rematch', { code });
  });

  // Preset emoji reactions. Only the allow-listed ones are relayed, at most a few per second.
  socket.on('reaction', (payload = {}) => {
    if (!socket.data.code || payload.code !== socket.data.code || !REACTIONS.includes(payload.emoji)) return;
    const now = Date.now();
    if (now - (socket.data.lastReactionAt || 0) < REACTION_COOLDOWN_MS) return;
    socket.data.lastReactionAt = now;
    socket.to(payload.code).emit('reaction', { code: payload.code, emoji: payload.emoji });
  });

  socket.on('disconnect', () => {
    const { code, player } = socket.data;
    const room = code && rooms.get(code);
    const seat = room?.seats[player];
    // Ignore sockets that were already replaced by a newer connection for this seat
    if (!seat || seat.socketId !== socket.id) return;
    seat.socketId = null;
    socket.to(code).emit('opponent-offline');
    socket.to(code).emit('disconnected'); // for older clients
    scheduleCleanup(code, room);
  });
});

httpServer.listen(PORT, process.env.HOST || '127.0.0.1', () => console.log(`listening on 127.0.0.1:${PORT}`));
