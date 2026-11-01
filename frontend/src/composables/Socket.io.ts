import { io } from "socket.io-client";

// `npm run dev` talks to the local backend on port 5001 of whatever host serves the page
// (so it also works over the LAN with `npm run dev:host`).
// Set VITE_SOCKET_URL to override, e.g. to test against production.
const SOCKET_URL =
  (import.meta.env.VITE_SOCKET_URL as string | undefined) ??
  (import.meta.env.DEV ? `http://${window.location.hostname}:5001` : "https://tic.x4d.nl/");

export default function useSocketIO() {
  const socket = io(SOCKET_URL);
  return {
    socket,
  };
}
