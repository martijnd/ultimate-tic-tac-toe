// Relay server for ultimate-tic-tac-toe. Each room (the session code in the URL)
// holds at most two players: the first is X, the second is O.
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

const io = new Server(httpServer, { cors: { origin: allowOrigin } });

io.on('connection', (socket) => {
  socket.on('join', ({ code } = {}) => {
    if (!code || typeof code !== 'string') return;
    const room = io.sockets.adapter.rooms.get(code);
    const size = room ? room.size : 0;
    if (size >= 2) return; // room full

    const player = size === 0 ? 'X' : 'O';
    socket.data.code = code;
    socket.join(code);
    socket.emit('accepted', player);
    if (size === 1) io.to(code).emit('player-accepted');
  });

  socket.on('place-mark', (payload = {}) => {
    if (payload.code !== socket.data.code) return;
    socket.to(payload.code).emit('place-mark', payload);
  });

  socket.on('disconnect', () => {
    if (socket.data.code) socket.to(socket.data.code).emit('disconnected');
  });
});

httpServer.listen(PORT, process.env.HOST || '127.0.0.1', () => console.log(`listening on 127.0.0.1:${PORT}`));
