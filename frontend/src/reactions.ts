// Preset emoji reactions. The backend only relays these (keep in sync with backend/index.js).
// Their spoken names live in the i18n files, in the same order.
export const REACTIONS = ['👏', '😂', '😮', '😬', '🔥'] as const;
export type Reaction = (typeof REACTIONS)[number];

/** Client-side cooldown, a bit longer than the server's so clicks are never silently dropped. */
export const REACTION_COOLDOWN_MS = 600;
