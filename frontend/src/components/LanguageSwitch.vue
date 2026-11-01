<script setup lang="ts">
import { LOCALES, MESSAGES, locale, setLocale, t } from '../i18n';
</script>

<template>
  <div class="lang" role="group" :aria-label="t.language">
    <button
      v-for="code in LOCALES"
      :key="code"
      type="button"
      class="lang__option"
      :lang="code"
      :aria-pressed="locale === code ? 'true' : 'false'"
      :aria-label="`${code.toUpperCase()}, ${MESSAGES[code].langName}`"
      :title="MESSAGES[code].langName"
      @click="setLocale(code)"
    >
      {{ code.toUpperCase() }}
    </button>
  </div>
</template>

<style scoped>
.lang {
  display: inline-flex;
  flex: none;
  padding: 3px;
  gap: 2px;
  border: 2px solid var(--rule);
  border-radius: var(--radius-control);
}

.lang__option {
  min-width: 40px;
  min-height: 34px;
  padding: 0 0.5rem;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--ink-soft);
  font: inherit;
  font-size: var(--step--1);
  font-weight: 600;
  letter-spacing: 0.02em;
  cursor: pointer;
  transition: background-color 120ms ease, color 120ms ease;
}

.lang__option:hover {
  color: var(--ink);
}

.lang__option[aria-pressed='true'] {
  background: var(--ink);
  color: var(--paper);
}

.lang__option:focus-visible {
  outline-offset: 1px;
}

@media (forced-colors: active) {
  .lang__option[aria-pressed='true'] {
    background: Highlight;
    color: HighlightText;
  }
}
</style>
