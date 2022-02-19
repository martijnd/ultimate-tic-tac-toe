<script setup lang="ts">
import { ref } from 'vue';
import Board from './components/Board.vue';

type RangeType = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

const playerXMarks = ref<number[]>([]);
const playerOMarks = ref<number[]>([]);
const currentPlayer = ref<'X' | 'O'>('X');
const winningMoves = [
  // horizontal
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9],

  //vertical
  [1, 4, 7],
  [2, 5, 8],
  [3, 6, 9],

  // diagonal
  [1, 5, 9],
  [3, 5, 7]
];
const allBoards = [1, 2, 3, 4, 5, 6, 7, 8, 9];
const availableBoards = ref(allBoards);
const wonBoards = ref<number[]>([]);
const wonPlayer = ref('');

function onPlayerWon(player: 'X' | 'O', index: number) {
  if (player === 'X') {
    playerXMarks.value = [...playerXMarks.value, index];
  } else {
    playerOMarks.value = [...playerOMarks.value, index];
  }

  wonBoards.value = [...wonBoards.value, index];

  if (winningMoves.some(x => isSame(x, playerOMarks.value)) || winningMoves.some(x => isSame(x, playerXMarks.value))) {
    wonPlayer.value = player;
    return;
  }
}


function isSame(winningMoveArray: number[], playerArray: number[]) {
  return winningMoveArray.every(x => playerArray.includes(x));
};

const marks = ref<Record<number, number[]>>({
  1: [],
  2: [],
  3: [],
  4: [],
  5: [],
  6: [],
  7: [],
  8: [],
  9: []
});

function onTurnChanged(index: number, boardIndex: number) {
  currentPlayer.value = currentPlayer.value === 'X' ? 'O' : 'X';
  marks.value[boardIndex] = [...marks.value[boardIndex], index];
  if (wonBoards.value.includes(index) || (marks.value[boardIndex].length === 9 && index === boardIndex)) {
    availableBoards.value = allBoards.filter(x => !wonBoards.value.includes(x));
    return;
  }
  availableBoards.value = [index];
}

</script>

<template>
  <div class="h-screen w-screen bg-slate-900 grid place-items-center">
    <div>
      <div
        class="text-white font-bold text-center text-4xl mb-4"
      >{{ wonPlayer ? `Player ${wonPlayer} won!` : `Player ${currentPlayer}'s turn` }}</div>
      <div
        :class="`grid grid-rows-3 grid-cols-3 select-none gap-2 ${wonPlayer ? 'pointer-events-none bg-transparent/50' : ''}`"
      >
        <Board
          v-for="i in 9"
          :index="(i as RangeType)"
          :active="availableBoards.includes(i)"
          :current-player="currentPlayer"
          @turn-changed="onTurnChanged($event, i)"
          @player-won="onPlayerWon($event, i)"
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
