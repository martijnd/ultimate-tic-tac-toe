import { io } from "socket.io-client";

export default function useSocketIO() {
  const socket = io("https://tic.lekkerklooien.nl/");
  return {
    socket,
  };
}
