<script setup lang="ts">
import { computed, ref } from 'vue';
import Cell from './Cell.vue';

type RangeType = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

const props = defineProps({
  index: {
    type: Number as () => RangeType,
    required: true
  },
  currentPlayer: {
    type: String as () => 'X' | 'O',
    required: true
  },
  active: {
    type: Boolean,
    required: true
  }
})

const emit = defineEmits(['playerWon', 'turnChanged']);

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
const done = ref(false);
function placeMark(i: number, player: string) {
  if (!props.active) {
    return;
  }

  if (playerXMarks.value.includes(i) || playerOMarks.value.includes(i) || done.value) {
    return;
  }
  if (player === 'X') {
    playerXMarks.value = [...playerXMarks.value, i];
  } else {
    playerOMarks.value = [...playerOMarks.value, i];
  }
  emit('turnChanged', i);

  if (winningMoves.some(x => isSame(x, playerOMarks.value)) || winningMoves.some(x => isSame(x, playerXMarks.value))) {
    emit('playerWon', player);
    winnerClass.value = player === 'X' ? 'bg-red-500' : 'bg-blue-500';
    done.value = true;
    return;
  }

}

function isSame(winningMoveArray: number[], playerArray: number[]) {
  return winningMoveArray.every(x => playerArray.includes(x));
};

const borderClass = computed(() => {
  return {
    1: 'border-r-2 border-b-2',
    2: 'border-x-2 border-b-2',
    3: 'border-l-2 border-b-2',
    4: 'border-y-2 border-r-2',
    5: 'border-2',
    6: 'border-y-2 border-l-2',
    7: 'border-t-2 border-r-2',
    8: 'border-t-2 border-x-2',
    9: 'border-t-2 border-l-2'
  }[props.index];
})

const winnerClass = ref('');

function isActiveCell(i: number) {
  return props.active && (!playerXMarks.value.includes(i) && !playerOMarks.value.includes(i));
}
</script>

<template>
  <div
    :class="`max-w-xl grid grid-cols-3 grid-rows-3 ${borderClass} ${winnerClass}`"
  >
    <Cell
      v-for="i in 9"
      :active="isActiveCell(i)"
      @click="placeMark(i, currentPlayer)"
    >{{ playerXMarks.includes(i) ? 'X' : playerOMarks.includes(i) ? 'O' : '' }}</Cell>
  </div>
</template>

