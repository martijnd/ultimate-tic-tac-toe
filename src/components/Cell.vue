<script setup lang="ts">
defineProps({
  active: {
    type: Boolean,
    required: true
  },
})
</script>

<template>
  <div
    :class="`p-4 border border-slate-600 text-white h-12 w-12 ${active ? 'bg-yellow-200' : ''}`"
  >
    <slot />
  </div>
</template>

