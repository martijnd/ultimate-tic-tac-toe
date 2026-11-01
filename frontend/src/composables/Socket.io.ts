import { io } from "socket.io-client";

export default function useSocketIO() {
  const socket = io("https://tic.x4d.nl/");
  return {
    socket,
  };
}
