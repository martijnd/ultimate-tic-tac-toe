<script setup lang="ts">
import { computed } from 'vue';
import { Player } from '../enums/Player';

const props = defineProps({
  active: {
    type: Boolean,
    required: true
  },
  winner: {
    type: String as () => Player | null,
    default: null
  }
})

const activeClass = computed(() => {
  if (props.active) {
    return 'border-zinc-300 cursor-pointer text-zinc-300';
  }

if (!props.winner) {
  return 'border-zinc-500 text-zinc-300 bg-zinc-600';
}
return '';
})

const winnerClass = computed(() => {
  if (props.winner === Player.X) {
    return 'bg-indigo-300 border-indigo-700 text-indigo-700';
  }

  if (props.winner === Player.O) {
    return 'bg-red-300 border-red-700 text-red-700';
  }

  return '';
});
</script>

<template>
  <div
    :class="`border grid place-items-center font-bold text-base sm:text-2xl md:text-4xl text-white h-8 w-8 sm:h-12 sm:w-12 md:h-16 md:w-16 ${activeClass} ${winnerClass}`"
  >
    <slot />
  </div>
</template>

