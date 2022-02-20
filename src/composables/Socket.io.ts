import { io } from 'socket.io-client'


export default function useSocketIO() {
  const socket = io('https://ultimate-tic-tac-toe-xi.herokuapp.com/');
  return {
    socket
  }
}
