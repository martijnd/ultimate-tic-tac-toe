import { ref, watch } from 'vue';

const TAP_ZOOM_KEY = 'uttt-tap-zoom';

function load(key: string, fallback: boolean) {
  try {
    const saved = localStorage.getItem(key);
    if (saved === 'on') return true;
    if (saved === 'off') return false;
  } catch {
    // Storage can be blocked (private mode); fall back to the default.
  }
  return fallback;
}

/** On touch screens, the first tap on a small board zooms in on it. Off by default. */
export const tapZoom = ref(load(TAP_ZOOM_KEY, false));

watch(tapZoom, value => {
  try {
    localStorage.setItem(TAP_ZOOM_KEY, value ? 'on' : 'off');
  } catch {
    // Not saved; the choice still applies for this visit.
  }
});
