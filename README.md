# Ultimate Tic Tac Toe

Monorepo with a Vue frontend and a Socket.IO backend.

- `frontend/`: Vue 3 + Vite app, hosted on Vercel at https://ultimatetictactoe.x4d.nl (set the Vercel project's Root Directory to `frontend`).
- `backend/`: Socket.IO server that checks and relays moves and keeps each room's moves in memory so players can reconnect. Runs in docker on the Linode behind nginx at https://tic.x4d.nl.

## Backend

Needs Node 26. Each room (the six-digit code in the URL) holds two players: the first is X, the second is O. The server refuses illegal moves (`rules.js`) and sends the player the real state instead. `rooms.js` holds the room logic and `index.js` the socket wiring. Run the tests with `npm test` in `backend/`.

```
cd backend
docker build -t ultimate-tic-tac-toe-server .
docker run -d --name ultimate-tic-tac-toe-server --restart unless-stopped \
  -p 127.0.0.1:5001:5001 ultimate-tic-tac-toe-server
```

`ALLOWED_ORIGINS` (comma separated) overrides the allowed CORS origins. `nginx-tic.x4d.nl.conf` is the nginx site config (run certbot afterwards).
