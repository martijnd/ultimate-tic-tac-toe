<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import { Game } from '../models/Game';
import { Board as BoardModel } from '../models/Board';
import { Cell } from '../models/Cell';
import Board from './Board.vue';

const props = defineProps<{
  game: Game;
  /** False while waiting in the lobby or after the opponent left. */
  interactive: boolean;
}>();

const emit = defineEmits<{
  (e: 'marked', board: BoardModel, cell: Cell): void;
}>();

const root = ref<HTMLElement | null>(null);

const yourTurn = computed(() =>
  props.interactive && !props.game.over && props.game.activePlayer === props.game.currentPlayer
);

const targetBoards = computed(() =>
  props.interactive && !props.game.over ? props.game.availableBoards.map(board => board.index) : []
);

// Roving tab stop: exactly one cell is in the tab order; arrow keys move between all 81.
const tabStop = ref({ board: 0, cell: 0 });

function firstPlayableCell() {
  for (const index of targetBoards.value) {
    const board = props.game.boards[index];
    const cell = board.cells.find(c => !c.mark);
    if (cell) return { board: index, cell: cell.index };
  }
  return null;
}

function focusCell(board: number, cell: number) {
  root.value
    ?.querySelector<HTMLElement>(`[data-board="${board}"][data-cell="${cell}"]`)
    ?.focus();
}

// When it becomes your move, point the tab stop at the board you have to play in.
// If you were already using the keyboard on the board, move focus there too.
watch(
  () => [yourTurn.value, props.game.moveCount, props.game] as const,
  async () => {
    if (!yourTurn.value) return;
    const target = firstPlayableCell();
    if (!target) return;
    const current = props.game.boards[tabStop.value.board];
    const stillGood =
      targetBoards.value.includes(tabStop.value.board) && !current.cells[tabStop.value.cell].mark;
    if (stillGood) return;

    tabStop.value = target;
    const hadFocus = root.value?.contains(document.activeElement);
    if (hadFocus) {
      await nextTick();
      focusCell(target.board, target.cell);
    }
  },
  { immediate: true }
);

const KEY_DELTAS: Record<string, [number, number]> = {
  ArrowUp: [-1, 0],
  ArrowDown: [1, 0],
  ArrowLeft: [0, -1],
  ArrowRight: [0, 1],
};

function onKeydown(event: KeyboardEvent) {
  const target = event.target as HTMLElement;
  if (!target.dataset || target.dataset.board === undefined) return;

  const board = Number(target.dataset.board);
  const cell = Number(target.dataset.cell);
  // Global coordinates on the 9×9 grid
  let row = Math.floor(board / 3) * 3 + Math.floor(cell / 3);
  let col = (board % 3) * 3 + (cell % 3);

  if (event.key in KEY_DELTAS) {
    const [dr, dc] = KEY_DELTAS[event.key];
    row = Math.min(8, Math.max(0, row + dr));
    col = Math.min(8, Math.max(0, col + dc));
  } else if (event.key === 'Home') {
    col = 0;
    if (event.ctrlKey) row = 0;
  } else if (event.key === 'End') {
    col = 8;
    if (event.ctrlKey) row = 8;
  } else {
    return;
  }

  event.preventDefault();
  const next = {
    board: Math.floor(row / 3) * 3 + Math.floor(col / 3),
    cell: (row % 3) * 3 + (col % 3),
  };
  tabStop.value = next;
  focusCell(next.board, next.cell);
}

function onCellFocus(board: number, cell: number) {
  tabStop.value = { board, cell };
}
</script>

<template>
  <div
    ref="root"
    class="global"
    :class="{ 'global--inactive': !interactive, 'global--over': game.over }"
    role="group"
    aria-label="Game board"
    aria-roledescription="ultimate tic-tac-toe board"
    @keydown="onKeydown"
  >
    <svg class="global__lines" viewBox="0 0 300 300" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <path pathLength="1" d="M100.5 4 C 98.8 80, 101.6 190, 99.4 296" />
      <path pathLength="1" d="M200.2 4 C 201.8 96, 198.6 210, 200.8 296" />
      <path pathLength="1" d="M4 99.6 C 90 101.4, 196 98.4, 296 100.4" />
      <path pathLength="1" d="M4 200.4 C 104 198.8, 210 201.6, 296 199.6" />
    </svg>
    <Board
      v-for="board in game.boards"
      :key="board.index"
      :board="board"
      :target="targetBoards.includes(board.index)"
      :only-target="targetBoards.length === 1"
      :your-turn="yourTurn"
      :current-player="game.currentPlayer"
      :last-move-cell="game.lastMove && game.lastMove.boardIndex === board.index ? game.lastMove.cellIndex : null"
      :tab-stop-cell="interactive && tabStop.board === board.index ? tabStop.cell : null"
      @marked="(cell: Cell) => emit('marked', board, cell)"
      @cell-focus="(cell: number) => onCellFocus(board.index, cell)"
    />
  </div>
</template>

<style scoped>
.global {
  position: relative;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, 1fr);
  width: var(--board-size);
  height: var(--board-size);
  user-select: none;
  -webkit-user-select: none;
}

.global--inactive {
  pointer-events: none;
}

/* The big hand-drawn #. Drawn in once when the page loads. */
.global__lines {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
  pointer-events: none;
}

.global__lines path {
  fill: none;
  stroke: var(--ink);
  stroke-width: 3.4;
  stroke-linecap: round;
  stroke-dasharray: 1 1;
  stroke-dashoffset: 1;
  animation: draw-line 420ms cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

.global__lines path:nth-child(2) {
  animation-delay: 110ms;
}

.global__lines path:nth-child(3) {
  animation-delay: 220ms;
}

.global__lines path:nth-child(4) {
  animation-delay: 330ms;
}

@keyframes draw-line {
  to {
    stroke-dashoffset: 0;
  }
}

@media (forced-colors: active) {
  .global__lines path {
    stroke: CanvasText;
  }
}
</style>
