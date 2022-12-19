import { io } from "socket.io-client";

export default function useSocketIO() {
  const socket = io("https://172-105-90-243.ip.linodeusercontent.com/");
  return {
    socket,
  };
}
