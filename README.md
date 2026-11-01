# Ultimate Tic Tac Toe

Monorepo with a Vue frontend and a Socket.IO relay backend.

- `frontend/`: Vue 3 + Vite app, hosted on Vercel at https://ultimatetictactoe.x4d.nl (set the Vercel project's Root Directory to `frontend`).
- `backend/`: Socket.IO relay server, runs in docker on the Linode behind nginx at https://tic.x4d.nl.

## Backend

Each room (the session code in the URL) holds two players: the first is X, the second is O.

```
cd backend
docker build -t ultimate-tic-tac-toe-server .
docker run -d --name ultimate-tic-tac-toe-server --restart unless-stopped \
  -p 127.0.0.1:5001:5001 ultimate-tic-tac-toe-server
```

`ALLOWED_ORIGINS` (comma separated) overrides the allowed CORS origins. `nginx-tic.x4d.nl.conf` is the nginx site config (run certbot afterwards).
