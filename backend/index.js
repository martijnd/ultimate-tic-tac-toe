// Socket.IO server for ultimate-tic-tac-toe. It seats players, checks and relays their moves,
// and remembers each room so players can reconnect. Room logic lives in rooms.js, the game
// rules in rules.js; this file only wires them to sockets.
const { createServer } = require('http');
const { Server } = require('socket.io');
const {
  Rooms, isRoomCode, takeSeat, placeMark, requestRematch, resumeState, randomToken,
} = require('./rooms');

const PORT = process.env.PORT || 5001;
const HOST = process.env.HOST || '127.0.0.1';
const ORIGINS = (process.env.ALLOWED_ORIGINS || 'https://ultimatetictactoe.x4d.nl,https://ultimate-tic-tac-toe-xi.vercel.app,http://localhost:3000,http://localhost:5173')
  .split(',');

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

// Every socket gets a bucket of events that refills over time; a socket that empties it
// (a script hammering the server) has its extra events dropped. Real play never gets close.
const RATE_BURST = 20;
const RATE_PER_SECOND = 5;

const httpServer = createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('ok');
});

// Faster heartbeat than the default (25s + 20s), so a player whose connection silently dies
// shows as offline to the other player within about 15 seconds.
const io = new Server(httpServer, { cors: { origin: allowOrigin }, pingInterval: 10000, pingTimeout: 5000 });

const rooms = new Rooms();

io.on('connection', (socket) => {
  let tokens = RATE_BURST;
  let refilledAt = Date.now();
  socket.use((_packet, next) => {
    const now = Date.now();
    tokens = Math.min(RATE_BURST, tokens + ((now - refilledAt) / 1000) * RATE_PER_SECOND);
    refilledAt = now;
    if (tokens < 1) return; // dropped: never calling next() ignores the event
    tokens -= 1;
    next();
  });

  socket.on('join', ({ code, token } = {}) => {
    // One room per socket. The client opens a new socket for every reconnect anyway.
    if (socket.data.code || !isRoomCode(code)) return;
    // Older clients send no token; they simply can't reclaim a seat.
    if (typeof token !== 'string' || !token || token.length > 64) token = randomToken();

    const room = rooms.getOrCreate(code);
    const seated = room && takeSeat(room, token);
    if (!seated) {
      socket.emit('full');
      return;
    }
    const { player, returning } = seated;

    // The same seat opened somewhere else (e.g. a duplicated tab): the newest one wins.
    const seat = room.seats[player];
    if (seat.socketId && seat.socketId !== socket.id) {
      const previous = io.sockets.sockets.get(seat.socketId);
      previous?.emit('replaced');
      previous?.disconnect(true);
    }
    seat.socketId = socket.id;
    rooms.cancelCleanup(room);

    socket.data.code = code;
    socket.data.player = player;
    socket.join(code);

    const state = resumeState(room, player);
    socket.emit('accepted', player);
    socket.emit('resume', state);

    if (returning) socket.to(code).emit('opponent-online');
    else if (state.otherJoined) io.to(code).emit('player-accepted');
  });

  socket.on('place-mark', ({ boardIndex, cellIndex } = {}) => {
    const { code, player } = socket.data;
    const room = rooms.get(code);
    if (!room) return;
    if (placeMark(room, player, boardIndex, cellIndex)) {
      // Refused. The client already drew the move, so send it the real state to rebuild from.
      socket.emit('resume', resumeState(room, player));
      return;
    }
    socket.to(code).emit('place-mark', { code, boardIndex, cellIndex, player });
  });

  // "Play again" pressed; the next game starts once both players have sent it.
  socket.on('rematch', () => {
    const { code, player } = socket.data;
    const room = rooms.get(code);
    if (!room || requestRematch(room, player) === 'ignored') return;
    socket.to(code).emit('rematch', { code });
  });

  // Preset emoji reactions. Only the allow-listed ones are relayed, at most a few per second.
  socket.on('reaction', ({ emoji } = {}) => {
    const { code } = socket.data;
    if (!code || !REACTIONS.includes(emoji)) return;
    const now = Date.now();
    if (now - (socket.data.lastReactionAt || 0) < REACTION_COOLDOWN_MS) return;
    socket.data.lastReactionAt = now;
    socket.to(code).emit('reaction', { code, emoji });
  });

  socket.on('disconnect', () => {
    const { code, player } = socket.data;
    const room = code && rooms.get(code);
    const seat = room?.seats[player];
    // Ignore sockets that were already replaced by a newer connection for this seat
    if (!seat || seat.socketId !== socket.id) return;
    seat.socketId = null;
    socket.to(code).emit('opponent-offline');
    rooms.scheduleCleanup(code);
  });
});

httpServer.listen(PORT, HOST, () => console.log(`listening on ${HOST}:${PORT}`));

// Docker and `node --watch` stop the server with a signal. Close the sockets cleanly so
// clients see the disconnect right away and start reconnecting.
function shutdown(signal) {
  console.log(`${signal} received, closing`);
  io.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 3000).unref();
}
process.once('SIGTERM', shutdown);
process.once('SIGINT', shutdown);
