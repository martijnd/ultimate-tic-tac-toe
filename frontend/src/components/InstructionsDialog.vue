<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';

const props = defineProps<{
  show: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const dialog = ref<HTMLDialogElement | null>(null);

function sync() {
  const el = dialog.value;
  if (!el) return;
  if (props.show && !el.open) el.showModal();
  if (!props.show && el.open) el.close();
}

onMounted(sync);
watch(() => props.show, sync);

// Clicking the backdrop (the dialog element itself, outside its content) closes it.
function onClick(event: MouseEvent) {
  if (event.target === dialog.value) dialog.value?.close();
}

// Small 9×9 grid lines for the diagram, every 30 units.
const thin = [30, 60, 120, 150, 210, 240];
const thick = [90, 180];
</script>

<template>
  <dialog
    ref="dialog"
    class="dialog"
    aria-labelledby="how-to-play-title"
    @close="emit('close')"
    @click="onClick"
  >
    <div class="dialog__inner">
      <header class="dialog__header">
        <h2 id="how-to-play-title" class="dialog__title">How to play</h2>
        <button type="button" class="dialog__close" aria-label="Close" @click="dialog?.close()">
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M6 6 L18 18 M18 6 L6 18" />
          </svg>
        </button>
      </header>

      <p class="dialog__lead">
        Nine small tic-tac-toe boards sit inside one big one. Win three small boards in a row to win the game.
      </p>

      <h3>Where you play</h3>
      <p>
        X opens anywhere. After that, the cell you pick decides which board your opponent plays in next. Play the top
        right cell of any board, and your opponent has to play in the top right board.
      </p>

      <figure class="diagram">
        <svg viewBox="-4 -4 278 278" role="img" aria-labelledby="diagram-caption">
          <rect class="diagram__target" x="183" y="3" width="84" height="84" rx="6" />
          <g class="diagram__thin">
            <line v-for="p in thin" :key="`v${p}`" :x1="p" y1="0" :x2="p" y2="270" />
            <line v-for="p in thin" :key="`h${p}`" x1="0" :y1="p" x2="270" :y2="p" />
          </g>
          <g class="diagram__thick">
            <line v-for="p in thick" :key="`V${p}`" :x1="p" y1="0" :x2="p" y2="270" />
            <line v-for="p in thick" :key="`H${p}`" x1="0" :y1="p" x2="270" :y2="p" />
          </g>
          <path class="diagram__x" d="M158 98 L172 112 M172 98 L158 112" />
          <path class="diagram__arrow" d="M174 96 C 190 82, 204 70, 216 58" />
          <path class="diagram__arrow" d="M206 58 L217 57 L216 68" />
        </svg>
        <figcaption id="diagram-caption">
          X played the top right cell of the centre board, so O has to play in the top right board.
        </figcaption>
      </figure>

      <p>
        The board you have to play in is highlighted. If that board is already won or full, you can play in any open
        board instead.
      </p>

      <h3>Winning</h3>
      <p>
        Get three in a row in a small board to win it. Once a board is won or full, nobody can play there again. Win
        three boards in a row, across, down or diagonally, to win the game. If there's nowhere left to play, it's a
        draw.
      </p>

      <button type="button" class="btn btn--primary btn--block" @click="dialog?.close()">Got it</button>
    </div>
  </dialog>
</template>

<style scoped>
.dialog {
  width: min(560px, calc(100vw - 24px));
  max-height: min(88vh, 860px);
  max-height: min(88svh, 860px);
  padding: 0;
  border: 1.5px solid var(--rule);
  border-radius: var(--radius-sheet);
  background: var(--surface);
  color: var(--ink);
  overflow: auto;
  overscroll-behavior: contain;
}

.dialog::backdrop {
  background: rgba(15, 30, 54, 0.45);
  backdrop-filter: blur(3px);
  -webkit-backdrop-filter: blur(3px);
}

.dialog[open] {
  animation: dialog-in 200ms cubic-bezier(0.2, 0.8, 0.2, 1);
}

@keyframes dialog-in {
  from {
    opacity: 0;
    transform: translateY(12px) scale(0.98);
  }
}

.dialog__inner {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: clamp(1.25rem, 4vw, 2rem);
  max-width: 64ch;
}

.dialog__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.dialog__title {
  margin: 0;
  font-size: var(--step-3);
  font-weight: 800;
  line-height: 1.1;
  letter-spacing: -0.02em;
}

.dialog__close {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  flex: none;
  border-radius: 999px;
  border: 1.5px solid var(--rule);
  background: transparent;
  color: var(--ink);
  cursor: pointer;
}

.dialog__close:hover {
  border-color: var(--ink);
}

.dialog__close svg {
  width: 20px;
  height: 20px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2.25;
  stroke-linecap: round;
}

.dialog__lead {
  font-size: var(--step-1);
  line-height: 1.45;
}

h3 {
  margin: 0.75rem 0 -0.5rem;
  font-size: var(--step-1);
  font-weight: 800;
  line-height: 1.2;
}

p {
  margin: 0;
}

.diagram {
  margin: 0.25rem 0;
  display: grid;
  gap: 0.75rem;
  justify-items: center;
}

.diagram svg {
  width: min(100%, 300px);
  height: auto;
}

.diagram__target {
  fill: var(--highlight-soft);
  stroke: var(--ink);
  stroke-width: 2;
}

.diagram__thin line {
  stroke: var(--ink-faint);
  stroke-width: 1;
}

.diagram__thick line {
  stroke: var(--ink);
  stroke-width: 3;
  stroke-linecap: round;
}

.diagram__x {
  fill: none;
  stroke: var(--x);
  stroke-width: 3.5;
  stroke-linecap: round;
}

.diagram__arrow {
  fill: none;
  stroke: var(--ink);
  stroke-width: 2.25;
  stroke-linecap: round;
  stroke-linejoin: round;
}

figcaption {
  color: var(--ink-soft);
  font-size: var(--step--1);
  text-align: center;
  max-width: 44ch;
}

.btn {
  margin-top: 0.75rem;
}
</style>
