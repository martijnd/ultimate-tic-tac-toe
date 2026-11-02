<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { t } from '../i18n';
import { tapZoom } from '../composables/settings';

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
</script>

<template>
  <dialog
    ref="dialog"
    class="dialog"
    aria-labelledby="settings-title"
    @close="emit('close')"
    @click="onClick"
  >
    <div class="dialog__inner">
      <header class="dialog__header">
        <h2 id="settings-title" class="dialog__title">{{ t.settings.title }}</h2>
        <button type="button" class="dialog__close" :aria-label="t.help.close" @click="dialog?.close()">
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M6 6 L18 18 M18 6 L6 18" />
          </svg>
        </button>
      </header>

      <label class="setting">
        <input v-model="tapZoom" type="checkbox" />
        <span class="setting__text">
          <span class="setting__label">{{ t.settings.tapZoom }}</span>
          <span class="setting__hint">{{ t.settings.tapZoomHint }}</span>
        </span>
      </label>
    </div>
  </dialog>
</template>

<style scoped>
/* A global reset zeroes the margin the browser uses to centre a modal dialog */
.dialog {
  margin: auto;
  width: min(460px, calc(100vw - 24px));
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

.setting {
  display: flex;
  align-items: flex-start;
  gap: 0.875rem;
  min-height: 44px;
  cursor: pointer;
}

.setting input {
  flex: none;
  width: 1.5rem;
  height: 1.5rem;
  margin: 0.1rem 0 0;
  accent-color: var(--ink);
}

.setting__text {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.setting__label {
  font-weight: 700;
}

.setting__hint {
  font-size: var(--step--1);
  line-height: 1.4;
  color: var(--ink-soft);
}
</style>
