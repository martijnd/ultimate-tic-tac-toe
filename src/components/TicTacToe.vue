<script setup lang="ts">
import { Game } from '../models/Game';
import { Cell } from '../models/Cell';
import Board from './Board.vue';

defineProps({
  game: {
    type: Object as () => Game,
    required: true
  },
})

const emit = defineEmits(['play-again', 'marked']);
</script>

<template>
  <div class="text-white font-bold text-center text-4xl mb-4">
    <template v-if="game.winner">
      {{ `Player ${game.winner} won!` }}
      <button
        @click="emit('play-again')"
        class="underline"
      >Play again</button>
    </template>
  </div>
  <div
    :class="`grid grid-rows-3 grid-cols-3 select-none gap-2 ${game.winner ? 'pointer-events-none bg-transparent/50' : ''}`"
  >
    <Board
      v-for="board of game.boards"
      :data="board"
      :active="game.availableBoards.map(board => board.index).includes(board.index)"
      :available="game.availableBoards.includes(board)"
      @marked="(cell: Cell) => emit('marked', board, cell)"
    ></Board>
  </div>
  <div class="flex justify-between text-white mt-2">
    <div>Move {{ game.moveCount }}</div>
    <div
      :class="`font-bold ${game.activePlayer === game.currentPlayer ? 'text-green-300' : 'text-indigo-300'}`"
    >{{ game.activePlayer === game.currentPlayer ? `Your turn — you are ${game.currentPlayer}` : 'Waiting for opponent...' }}</div>
  </div>
</template>
