<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { Game } from '../models/Game';
import { Board as BoardModel } from '../models/Board';
import { Cell } from '../models/Cell';
import Board from './Board.vue';
import { t } from '../i18n';

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

// Tap-to-zoom: on a touch screen the 81 cells are too small to hit reliably, so the first tap on
// a small board zooms in on it and the next tap places the mark.
const ZOOM_SCALE = 2.7;
const zoomed = ref<number | null>(null);
const touchZoom = ref(false);
let touchQuery: MediaQueryList | null = null;

function syncTouchZoom() {
  touchZoom.value = !!touchQuery?.matches;
  if (!touchZoom.value) zoomed.value = null;
}

onMounted(() => {
  touchQuery = window.matchMedia('(pointer: coarse) and (max-width: 700px)');
  touchQuery.addEventListener('change', syncTouchZoom);
  syncTouchZoom();
});

onBeforeUnmount(() => touchQuery?.removeEventListener('change', syncTouchZoom));

// Back to the full board when the game ends or is restarted
watch(
  () => [props.interactive, props.game.over, props.game.moveCount, props.game] as const,
  () => {
    zoomed.value = null;
  }
);

const zoomStyle = computed(() => {
  if (zoomed.value === null) return undefined;
  const cx = (zoomed.value % 3) - 1;
  const cy = Math.floor(zoomed.value / 3) - 1;
  const shift = (n: number) => `${((-ZOOM_SCALE * n) / 3) * 100}%`;
  return { transform: `translate(${shift(cx)}, ${shift(cy)}) scale(${ZOOM_SCALE})` };
});

function onClickCapture(event: MouseEvent) {
  if (!touchZoom.value) return;
  // Keyboard activation (detail 0) should always place the mark directly
  if (event.detail === 0 && event.target instanceof HTMLElement && event.target.closest('[data-board]')) return;

  const cell = (event.target as HTMLElement).closest<HTMLElement>('[data-board]');
  if (!cell) {
    if (zoomed.value !== null) zoomed.value = null;
    return;
  }

  const board = Number(cell.dataset.board);
  if (zoomed.value === board) {
    // A tap on a cell you can play places the mark (the click goes through); then zoom back out
    if (cell.getAttribute('aria-disabled') !== 'true') zoomed.value = null;
    return;
  }

  event.stopPropagation();
  event.preventDefault();
  zoomed.value = zoomed.value === null ? board : null;
}

function onCellFocus(board: number, cell: number) {
  tabStop.value = { board, cell };
}
</script>

<template>
  <div
    ref="root"
    class="global"
    :class="{ 'global--inactive': !interactive, 'global--over': game.over, 'global--zoomed': zoomed !== null }"
    role="group"
    :aria-label="t.board.label"
    :aria-roledescription="t.board.roleDescription"
    @keydown="onKeydown"
    @keydown.esc="zoomed = null"
    @click.capture="onClickCapture"
  >
    <div class="global__inner" :style="zoomStyle">
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
    <button v-if="zoomed !== null" type="button" class="global__zoom-out" @click.stop="zoomed = null">
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6 6l12 12M18 6L6 18" /></svg>
      {{ t.board.zoomOut }}
    </button>
  </div>
</template>

<style scoped>
.global {
  position: relative;
  width: var(--board-size);
  height: var(--board-size);
  user-select: none;
  -webkit-user-select: none;
}

.global--zoomed {
  overflow: hidden;
  border-radius: 14px;
}

.global__inner {
  position: relative;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, 1fr);
  width: 100%;
  height: 100%;
  transition: transform 240ms cubic-bezier(0.3, 0.7, 0.2, 1);
}

.global__zoom-out {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 3;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  min-height: 44px;
  padding: 0 0.9rem 0 0.7rem;
  border: 1px solid var(--ink-faint);
  border-radius: 999px;
  background: var(--paper, Canvas);
  color: var(--ink);
  font: inherit;
  font-size: var(--step--1);
  cursor: pointer;
  touch-action: manipulation;
}

.global__zoom-out svg {
  width: 1rem;
  height: 1rem;
  fill: none;
  stroke: currentColor;
  stroke-width: 2.4;
  stroke-linecap: round;
}

@media (prefers-reduced-motion: reduce) {
  .global__inner {
    transition: none;
  }
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
