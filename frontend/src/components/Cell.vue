<script setup lang="ts">
import Mark from './Mark.vue';

defineProps<{
  boardIndex: number;
  cellIndex: number;
  mark?: string;
  /** You may place your mark here right now. */
  playable: boolean;
  /** Mark shown as a faint preview when hovering or focusing a playable cell. */
  previewPlayer: string;
  isLastMove: boolean;
  label: string;
  tabindex: number;
}>();

const emit = defineEmits<{
  (e: 'select'): void;
  (e: 'focus'): void;
}>();
</script>

<template>
  <button
    type="button"
    class="cell"
    :class="{
      'cell--playable': playable,
      'cell--last': isLastMove,
      'cell--last-x': isLastMove && mark === 'X',
      'cell--last-o': isLastMove && mark === 'O',
    }"
    :data-board="boardIndex"
    :data-cell="cellIndex"
    :aria-label="label"
    :aria-disabled="playable ? undefined : 'true'"
    :tabindex="tabindex"
    @click="playable && emit('select')"
    @focus="emit('focus')"
  >
    <span v-if="mark" class="cell__mark">
      <Mark :player="mark" animate />
    </span>
    <span v-else-if="playable" class="cell__mark cell__preview">
      <Mark :player="previewPlayer" />
    </span>
  </button>
</template>

<style scoped>
.cell {
  position: relative;
  display: grid;
  place-items: center;
  width: 100%;
  height: 100%;
  min-width: 0;
  padding: 0;
  margin: 0;
  background: transparent;
  border: 0 solid var(--ink-faint);
  border-radius: 0;
  color: inherit;
  cursor: default;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}

/* Thin inner lines of the small # (no outer border) */
.cell:nth-child(3n + 1),
.cell:nth-child(3n + 2) {
  border-right-width: max(1px, 0.12vmin);
}

.cell:nth-child(-n + 6) {
  border-bottom-width: max(1px, 0.12vmin);
}

.cell--playable {
  cursor: pointer;
}

.cell__mark {
  position: absolute;
  inset: 17%;
  pointer-events: none;
}

.cell__preview {
  opacity: 0;
  transition: opacity 100ms ease;
}

@media (hover: hover) and (pointer: fine) {
  .cell--playable:hover .cell__preview {
    opacity: 0.28;
  }
}

.cell--playable:focus-visible .cell__preview {
  opacity: 0.28;
}

.cell:focus-visible {
  z-index: 2;
  outline: 3px solid var(--focus);
  outline-offset: -2px;
  border-radius: 6px;
  box-shadow: inset 0 0 0 5px var(--focus-halo);
}

/* The most recent move gets a soft ink wash so you can follow the game */
.cell--last::before {
  content: '';
  position: absolute;
  inset: 8%;
  border-radius: 999px;
  opacity: 0.16;
  pointer-events: none;
}

.cell--last-x::before {
  background: var(--x);
}

.cell--last-o::before {
  background: var(--o);
}

@media (forced-colors: active) {
  .cell {
    border-color: CanvasText;
  }

  .cell--last::before {
    background: Highlight;
  }
}
</style>
