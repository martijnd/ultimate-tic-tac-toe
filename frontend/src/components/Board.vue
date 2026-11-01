<script setup lang="ts">
import { computed } from 'vue';
import { Board } from '../models/Board';
import { Cell as CellModel } from '../models/Cell';
import { t } from '../i18n';
import Cell from './Cell.vue';
import Mark from './Mark.vue';

const props = defineProps<{
  board: Board;
  /** The player to move has to play in this board. */
  target: boolean;
  /** This is the only board the player to move may play in (not a free choice). */
  onlyTarget: boolean;
  /** It is your move (and the board accepts input at all). */
  yourTurn: boolean;
  currentPlayer: string;
  lastMoveCell: number | null;
  tabStopCell: number | null;
}>();

const emit = defineEmits<{
  (e: 'marked', cell: CellModel): void;
  (e: 'cell-focus', cellIndex: number): void;
}>();

const name = computed(() => t.value.board.name(props.board.index));
const winner = computed(() => props.board.winner);
const full = computed(() => !winner.value && props.board.filled);
const playableHere = computed(() => props.target && props.yourTurn);

const groupLabel = computed(() => {
  if (winner.value) return `${name.value}, ${t.value.board.wonBy(winner.value)}`;
  if (full.value) return `${name.value}, ${t.value.board.full}`;
  if (playableHere.value) return `${name.value}, ${t.value.board.playHere}`;
  return name.value;
});

function cellLabel(cell: CellModel) {
  return t.value.board.cell(cell.index, cell.mark, props.lastMoveCell === cell.index);
}
</script>

<template>
  <div
    class="board"
    :class="{
      'board--target-you': target && yourTurn,
      'board--target-them': target && !yourTurn,
      'board--only-target': target && onlyTarget,
      'board--won': winner,
      'board--full': full,
    }"
    role="group"
    :aria-label="groupLabel"
  >
    <div class="board__cells">
      <Cell
        v-for="cell in board.cells"
        :key="cell.index"
        :board-index="board.index"
        :cell-index="cell.index"
        :mark="cell.mark"
        :playable="playableHere && !cell.mark"
        :preview-player="currentPlayer"
        :is-last-move="lastMoveCell === cell.index"
        :label="cellLabel(cell)"
        :tabindex="tabStopCell === cell.index ? 0 : -1"
        @select="emit('marked', cell)"
        @focus="emit('cell-focus', cell.index)"
      />
    </div>
    <div v-if="winner" class="board__winner" aria-hidden="true">
      <Mark :player="winner" animate />
    </div>
  </div>
</template>

<style scoped>
.board {
  position: relative;
  padding: 9%;
  border-radius: 14px;
  transition: background-color 180ms ease;
}

/* Highlighter: it's your move and you have to play here */
.board--target-you::before {
  content: '';
  position: absolute;
  inset: 4%;
  border-radius: 12px;
  background: var(--highlight-soft);
  pointer-events: none;
  animation: highlight-in 220ms ease-out;
}

/* Sent to one specific board: outline it too, so it stands out without relying on colour */
.board--target-you.board--only-target::before {
  box-shadow: inset 0 0 0 2px var(--target-outline);
}

/* Your opponent has to play here */
.board--target-them.board--only-target::before {
  content: '';
  position: absolute;
  inset: 4%;
  border-radius: 12px;
  border: 2px dashed var(--ink-soft);
  pointer-events: none;
}

.board__cells {
  position: relative;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, 1fr);
  width: 100%;
  aspect-ratio: 1 / 1;
}

.board--won .board__cells,
.board--full .board__cells {
  opacity: 0.32;
}

.board__winner {
  position: absolute;
  inset: 12%;
  pointer-events: none;
  --mark-stroke: 7;
}

@keyframes highlight-in {
  from {
    opacity: 0;
    transform: scale(0.96);
  }
}

@media (forced-colors: active) {
  .board--target-you::before {
    background: transparent;
    box-shadow: none;
    border: 3px solid Highlight;
  }
}
</style>
