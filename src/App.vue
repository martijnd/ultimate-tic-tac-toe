<script setup lang="ts">
import { ref } from 'vue';

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

const playerXMarks = ref<number[]>([]);
const playerOMarks = ref<number[]>([]);

function placeMark(i: number, player: string) {
  if (playerXMarks.value.includes(i) || playerOMarks.value.includes(i)) {
    return;
  }
  if (player === 'X') {
    playerXMarks.value = [...playerXMarks.value, i];
  } else {
    playerOMarks.value = [...playerOMarks.value, i];
  }
  
  if (winningMoves.some(x => isSame(x, playerOMarks.value)) || winningMoves.some(x => isSame(x, playerXMarks.value))) {
    console.log('Game is over. Player ' + player + ' wins!');
    return;
  }


  currentPlayer.value = player === 'X' ? 'O' : 'X';
}
const currentPlayer = ref('X');

function isSame(array1: number[], array2: number[]) {
  return (array1.length === array2.length) && array1.sort().every(function(element, index) {
    return element === array2.sort()[index]; 
  });
};

</script>

<template>
  <div class="h-screen w-screen bg-slate-900 grid place-items-center">
    <!-- Board -->
    <div class="max-w-xl grid grid-cols-3 grid-rows-3">
      <div
        v-for="i in 9"
        class="p-4 border border-slate-600 text-white h-12 w-12"
        @click="placeMark(i, currentPlayer)"
      >{{ playerXMarks.includes(i) ? 'X' : playerOMarks.includes(i) ? 'O' : '' }}</div>
    </div>
  </div>
</template>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
}
</style>
