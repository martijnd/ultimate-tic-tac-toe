import { io } from 'socket.io-client'


export default function useSocketIO() {
  const socket = io('http://localhost:3001');
  // const socket = io('https://ultimate-tic-tac-toe-xi.herokuapp.com/');
  return {
    socket
  }
}
