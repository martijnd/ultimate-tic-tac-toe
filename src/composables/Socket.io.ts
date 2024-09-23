import { io } from "socket.io-client";

export default function useSocketIO() {
  const socket = io("http://172.233.59.216/");
  return {
    socket,
  };
}
