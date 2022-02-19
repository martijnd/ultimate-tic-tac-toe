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
    :class="`p-2 md:p-4 border grid place-items-center border-slate-600 font-bold text-sm md:text-4xl text-white h-8 w-8 md:h-16 md:w-16 ${active ? 'bg-yellow-200/50 cursor-pointer' : ''}`"
  >
    <slot />
  </div>
</template>

