import { io } from 'socket.io-client'


export default function useSocketIO() {
  const socket = io('http://localhost:3001');
  return {
    socket
  }
}
