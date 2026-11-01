<script setup lang="ts">
// A hand-drawn X or O. With `animate`, the strokes are drawn in like a pen on paper.
withDefaults(defineProps<{
  player: string;
  animate?: boolean;
}>(), {
  animate: false,
});
</script>

<template>
  <svg
    class="mark"
    :class="[player === 'X' ? 'mark--x' : 'mark--o', { 'mark--animate': animate }]"
    viewBox="0 0 100 100"
    aria-hidden="true"
    focusable="false"
  >
    <template v-if="player === 'X'">
      <path pathLength="1" d="M23 21 C 39 37, 60 61, 79 80" />
      <path pathLength="1" d="M78 22 C 61 38, 40 59, 22 79" />
    </template>
    <path
      v-else
      pathLength="1"
      d="M53 17 C 72 17, 85 32, 84 51 C 83 71, 67 85, 49 84 C 29 83, 16 68, 17 49 C 18 31, 31 18, 57 19"
    />
  </svg>
</template>

<style scoped>
.mark {
  display: block;
  width: 100%;
  height: 100%;
  overflow: visible;
}

.mark path {
  fill: none;
  stroke: currentColor;
  stroke-width: var(--mark-stroke, 10);
  stroke-linecap: round;
  stroke-linejoin: round;
}

.mark--x {
  color: var(--x);
}

.mark--o {
  color: var(--o);
}

.mark--animate path {
  stroke-dasharray: 1 1;
  stroke-dashoffset: 1;
  animation: draw 200ms cubic-bezier(0.3, 0, 0.2, 1) forwards;
}

.mark--animate.mark--o path {
  animation-duration: 340ms;
}

.mark--animate path + path {
  animation-delay: 150ms;
}

@keyframes draw {
  to {
    stroke-dashoffset: 0;
  }
}

@media (forced-colors: active) {
  .mark path {
    stroke: CanvasText;
  }
}
</style>
