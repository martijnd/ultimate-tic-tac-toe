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

// A saved choice wins, then the browser's preferred languages, then English.
function detectLocale(): Locale {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (isLocale(saved)) return saved;
  } catch {
    // Storage can be blocked (private mode, strict cookie settings); fall through.
  }
  const preferred = navigator.languages?.length ? navigator.languages : [navigator.language];
  for (const tag of preferred) {
    const base = tag?.toLowerCase().split('-')[0];
    if (isLocale(base)) return base;
  }
  return 'en';
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
