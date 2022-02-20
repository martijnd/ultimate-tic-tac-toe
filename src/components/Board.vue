<script setup lang="ts">
import { computed, ref } from 'vue';
import { Board } from '../models/Board';
import Cell from './Cell.vue';

const props = defineProps({
  data: {
    type: Object as () => Board,
    required: true
  },
  active: {
    type: Boolean,
    default: false
  },
})

const emit = defineEmits(['marked']);

const winnerClass = computed(() => {
  if (props.data.winner === 'X') {
    return 'bg-blue-400/50';
  }

  if (props.data.winner === 'O') {
    return 'bg-red-400/50';
  }
});

</script>

<template>
  <div :class="`max-w-xl grid grid-cols-3 grid-rows-3 ${winnerClass}`">
    <Cell
      v-for="cell in data.cells"
      :active="active"
      @click="emit('marked', cell)"
    >{{ cell.mark ?? '' }}</Cell>
  </div>
</template>

