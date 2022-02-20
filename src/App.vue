<script setup lang="ts">
import { ref } from 'vue';
import Board from './components/Board.vue';
import { Game } from './models/Game';
import { Board as BoardModel } from './models/Board';
import useSocketIO from './composables/Socket.io';
import { Cell } from './models/Cell';
import { data } from './data';
const { socket } = useSocketIO();

const wonPlayer = ref('');

const game = ref<Game | null>(null);
const name = ref('');
const code = window.location.pathname.split('/')[1];

function onMarked(board: BoardModel, cell: Cell) {
  // If you're not the active player
  if (game.value?.activePlayer !== game.value?.currentPlayer) {
    // TODO: Show an error message
    return;
  }
  game.value?.placeMark(board, cell, game.value?.currentPlayer);
  socket.emit('place-mark', {
    code, boardIndex: board.index,
    cellIndex: cell.index,
    player: game.value?.currentPlayer
  });
}

function onSubmit() {
  socket.emit('join', { code, name: name.value });

  socket.on('accepted', (player) => {

    game.value = new Game(player);

    socket.on('place-mark', ({ code: cCode, boardIndex, cellIndex, player }) => {
      if (game.value && player !== game.value?.currentPlayer && code === cCode) {
        const board = game.value?.boards.find(b => b.index === boardIndex);
        const cell = board?.cells.find((c: Cell) => c.index === cellIndex);
        if (board && cell) {
          game.value?.placeMark(board, cell, player);
        }
      }
    });

    socket.on('disconnected', () => {
      showErrorMessage('The opponent has disconnected');
      game.value = null;
    });
  });
}

function showErrorMessage(message: string) {
  alert(message);
}

</script>

<template>
  <div class="h-screen w-screen bg-slate-900 grid place-items-center">
    <div v-if="game">
      <div class="text-white font-bold text-center text-4xl mb-4">
        <template v-if="game.winner">{{ `Player ${game.winner} won!` }}</template>
        <template
          v-else
        >{{ game.activePlayer === game.currentPlayer ? 'Your turn' : 'Waiting...' }}</template>
      </div>
      <div
        :class="`grid grid-rows-3 grid-cols-3 select-none gap-2 ${wonPlayer ? 'pointer-events-none bg-transparent/50' : ''}`"
      >
        <Board
          v-for="board of game.boards"
          :data="board"
          :active="game.availableBoards.map(board => board.index).includes(board.index)"
          :available="game.availableBoards.includes(board)"
          @marked="(cell) => onMarked(board, cell)"
        ></Board>
      </div>
    </div>
    <div v-else>
      <form @submit.prevent="onSubmit">
        <input type="text" v-model="name" class="rounded-l p-2" />
        <button
          type="submit"
          class="bg-blue-500 font-bold px-4 py-2 rounded-r text-white"
        >Enter</button>
      </form>
    </div>
  </div>
</template>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
}
</style>
