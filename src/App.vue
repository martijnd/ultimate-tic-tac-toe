<script setup lang="ts">
import { computed, ref } from 'vue';
import Board from './components/Board.vue';
import { Game } from './models/Game';
import { Board as BoardModel } from './models/Board';
import useSocketIO from './composables/Socket.io';
import { Cell } from './models/Cell';
import { data } from './data';
type RangeType = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
const { socket } = useSocketIO();

const wonBoards = computed(() => game.value.boards.filter(board => board.winner));
const wonPlayer = ref('');

const game = ref(new Game());

function onMarked(board: BoardModel, cell: Cell) {
  if (board.available && board.index === game.value.lastBoardIndex) {
    }
    game.value.placeMark(cell, board);


  // if (wonBoards.value.includes(index) || (marks.value[boardIndex].length === 9 && index === boardIndex)) {
  //   availableBoards.value = allBoards.filter(x => !wonBoards.value.includes(x));
  //   return;
  // }
  // availableBoards.value = [index];
}

// onMounted(() => {
//   const code = window.location.pathname.split('/')[1];

//   socket.emit('join', code);
//   socket.on('accepted', (player) => {
//     console.log('accepted', player);
//   });
// });

</script>

<template>
  <div class="h-screen w-screen bg-slate-900 grid place-items-center">
    <div>
      <div
        class="text-white font-bold text-center text-4xl mb-4"
      >{{ wonPlayer ? `Player ${wonPlayer} won!` : `Player ${game.currentPlayer}'s turn` }}</div>
      <div
        :class="`grid grid-rows-3 grid-cols-3 select-none gap-2 ${wonPlayer ? 'pointer-events-none bg-transparent/50' : ''}`"
      >
        <Board
          v-for="board of game.boards"
          :data="board"
          :last-board-index="game.lastBoardIndex"
          :available="game.availableBoards.includes(board)"
          @marked="(cell) => onMarked(board, cell)"
        ></Board>
      </div>
    </div>
  </div>
</template>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
}
</style>
