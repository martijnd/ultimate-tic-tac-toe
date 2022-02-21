<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps({
  active: {
    type: Boolean,
    required: true
  },
  winner: {
    type: String as () => 'X' | 'O' | null,
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
  if (props.winner === 'X') {
    return 'bg-indigo-300 border-indigo-700 text-indigo-700';
  }

  if (props.winner === 'O') {
    return 'bg-red-300 border-red-700 text-red-700';
  }

  return '';
});
</script>

<template>
  <div
    :class="`p-2 md:p-4 border grid place-items-center font-bold text-sm md:text-4xl text-white h-8 w-8 md:h-16 md:w-16 ${activeClass} ${winnerClass}`"
  >
    <slot />
  </div>
</template>

