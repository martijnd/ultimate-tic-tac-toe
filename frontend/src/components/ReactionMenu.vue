<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch } from 'vue';
import { REACTIONS, type Reaction } from '../reactions';
import { t } from '../i18n';

// A small "React" button that opens a popup with the preset emojis.
// Escape or a click outside closes it; arrow keys move between the emojis.

const emit = defineEmits<{
  (e: 'react', emoji: Reaction): void;
}>();

const open = ref(false);
const root = ref<HTMLElement | null>(null);
const toggle = ref<HTMLButtonElement | null>(null);
const menu = ref<HTMLElement | null>(null);

function items() {
  return Array.from(menu.value?.querySelectorAll<HTMLButtonElement>('button') ?? []);
}

async function show() {
  open.value = true;
  await nextTick();
  items()[0]?.focus();
}

function close(returnFocus = true) {
  if (!open.value) return;
  open.value = false;
  if (returnFocus) toggle.value?.focus();
}

function pick(emoji: Reaction) {
  emit('react', emoji);
  close();
}

function onMenuKeydown(event: KeyboardEvent) {
  const list = items();
  const i = list.indexOf(document.activeElement as HTMLButtonElement);
  let next = -1;
  if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (i + 1) % list.length;
  else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (i - 1 + list.length) % list.length;
  else if (event.key === 'Home') next = 0;
  else if (event.key === 'End') next = list.length - 1;
  else if (event.key === 'Escape') {
    event.preventDefault();
    close();
    return;
  } else if (event.key === 'Tab') {
    close(false);
    return;
  }
  if (next < 0) return;
  event.preventDefault();
  list[next].focus();
}

function onPointerDown(event: PointerEvent) {
  if (!root.value?.contains(event.target as Node)) close(false);
}

watch(open, (isOpen) => {
  if (isOpen) document.addEventListener('pointerdown', onPointerDown);
  else document.removeEventListener('pointerdown', onPointerDown);
});

onBeforeUnmount(() => document.removeEventListener('pointerdown', onPointerDown));
</script>

<template>
  <div ref="root" class="reactions">
    <button
      ref="toggle"
      type="button"
      class="btn btn--quiet reactions__toggle"
      aria-haspopup="true"
      :aria-expanded="open"
      :aria-label="t.reactions.open"
      :title="t.reactions.open"
      @click="open ? close() : show()"
    >
      <svg class="reactions__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <circle cx="12" cy="12" r="9" />
        <path d="M8.2 14.2c1 1.5 2.3 2.2 3.8 2.2s2.8-.7 3.8-2.2" />
        <circle class="reactions__eye" cx="9" cy="9.8" r="0.6" />
        <circle class="reactions__eye" cx="15" cy="9.8" r="0.6" />
      </svg>
    </button>

    <div
      v-if="open"
      ref="menu"
      class="reactions__menu"
      role="group"
      :aria-label="t.reactions.label"
      @keydown="onMenuKeydown"
    >
      <button
        v-for="(emoji, i) in REACTIONS"
        :key="emoji"
        type="button"
        class="reactions__item"
        :aria-label="t.reactions.names[i]"
        :title="t.reactions.names[i]"
        @click="pick(emoji)"
      >
        <span aria-hidden="true">{{ emoji }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
/* Not positioned itself: the popup is placed against the nearest positioned ancestor
   (the player chip), so it can open across the panel instead of being pinned to the button. */
.reactions {
  flex: none;
}

/* Icon-only, so it fits beside the headline without squeezing it */
.reactions__toggle {
  width: 44px;
  padding: 0;
}

.reactions__toggle[aria-expanded='true'] {
  border-color: var(--ink);
  background: var(--highlight-soft);
}

.reactions__icon {
  width: 24px;
  height: 24px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.75;
  stroke-linecap: round;
}

.reactions__eye {
  fill: currentColor;
}

/* Popup below the chip, starting at its left edge so it stays inside the panel */
.reactions__menu {
  position: absolute;
  left: 0;
  top: calc(100% + 8px);
  z-index: 5;
  display: flex;
  gap: 0.25rem;
  padding: 0.375rem;
  border: 1.5px solid var(--rule);
  border-radius: 999px;
  background: var(--surface);
  box-shadow: 0 8px 24px rgba(15, 30, 54, 0.16);
  transform-origin: 30% 0;
  animation: menu-in 160ms cubic-bezier(0.2, 0.8, 0.3, 1.2);
}

.reactions__item {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  padding: 0;
  border: 0;
  border-radius: 999px;
  background: transparent;
  font-size: 1.5rem;
  line-height: 1;
  cursor: pointer;
  transition: background-color 100ms ease, transform 100ms ease;
}

.reactions__item:hover {
  background: var(--highlight-soft);
  transform: scale(1.15);
}

.reactions__item:focus-visible {
  outline-offset: 0;
}

@keyframes menu-in {
  from {
    opacity: 0;
    transform: translateY(-6px) scale(0.85);
  }
}

@media (forced-colors: active) {
  .reactions__menu {
    border-color: CanvasText;
  }
}
</style>
