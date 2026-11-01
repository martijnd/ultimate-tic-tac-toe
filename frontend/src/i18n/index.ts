import { computed, ref, watchEffect } from 'vue';
import en from './en';
import nl from './nl';

export const MESSAGES = { en, nl };
export type Locale = keyof typeof MESSAGES;
export const LOCALES = Object.keys(MESSAGES) as Locale[];

const STORAGE_KEY = 'uttt-locale';

function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && value in MESSAGES;
}

const DEFAULT_LOCALE: Locale = 'nl';

// A language picked with the switch wins; everyone else starts in Dutch.
function detectLocale(): Locale {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (isLocale(saved)) return saved;
  } catch {
    // Storage can be blocked (private mode, strict cookie settings); fall through.
  }
  return DEFAULT_LOCALE;
}

export const locale = ref<Locale>(detectLocale());

/** Messages for the current language. Unwrapped automatically in templates: `{{ t.howToPlay }}`. */
export const t = computed(() => MESSAGES[locale.value]);

export function setLocale(next: Locale) {
  locale.value = next;
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // Not saved; the choice still applies for this visit.
  }
}

// Keep <html lang> in sync so screen readers pronounce the text correctly.
watchEffect(() => {
  document.documentElement.lang = locale.value;
});
