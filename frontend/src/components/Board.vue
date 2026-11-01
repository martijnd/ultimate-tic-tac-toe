<script setup lang="ts">
import { computed } from 'vue';
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



</script>

<template>
  <div class="max-w-xl grid grid-cols-3 grid-rows-3">
    <Cell
      v-for="cell in data.cells"
      :active="cell.active && active"
      :winner="data.winner"
      @click="emit('marked', cell)"
    >{{ cell.mark ?? '' }}</Cell>
  </div>
</template>

