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

function onPlayerWon(player: 'X' | 'O', index: number) {
  if (player === 'X') {
    playerXMarks.value = [...playerXMarks.value, index];
  } else {
    playerOMarks.value = [...playerOMarks.value, index];
  }

  if (winningMoves.some(x => isSame(x, playerOMarks.value)) || winningMoves.some(x => isSame(x, playerXMarks.value))) {
    console.log(`player ${player} won!`);
    return;
  }
}

function isSame(array1: number[], array2: number[]) {
  return (array1.length === array2.length) && array1.sort().every((element, index) => element === array2.sort()[index]);
};

function onTurnChanged(index: number) {
  currentPlayer.value = currentPlayer.value === 'X' ? 'O' : 'X';
  availableBoards.value = [index];
}

</script>

<template>
  <div class="h-screen w-screen bg-slate-900 grid place-items-center">
    <!-- Board -->
    <div class="grid grid-rows-3 grid-cols-3">
      <Board
        v-for="i in 9"
        :index="(i as RangeType)"
        :active="availableBoards.includes(i)"
        :current-player="currentPlayer"
        @turn-changed="onTurnChanged"
        @player-won="onPlayerWon($event, i)"
      ></Board>
    </div>
  </div>
</template>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
}
</style>
