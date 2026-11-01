// Per-tab identity for a game, so a refresh or dropped connection gets the same seat back.
// sessionStorage (not localStorage) so a second tab on the same link joins as the other player.
const TOKEN_KEY = (code: string) => `uttt-token-${code}`;
const STARTED_KEY = (code: string) => `uttt-started-${code}`;

function newToken() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}

function read(key: string) {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null; // storage blocked: reconnecting after a refresh won't work, the rest still does
  }
}

function write(key: string, value: string) {
  try {
    sessionStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

export function playerToken(code: string) {
  const saved = read(TOKEN_KEY(code));
  if (saved) return saved;
  const token = newToken();
  write(TOKEN_KEY(code), token);
  return token;
}

/** Whether this tab already pressed "Start game", so a refresh in the lobby skips it. */
export function hasStarted(code: string) {
  return read(STARTED_KEY(code)) === '1';
}

export function markStarted(code: string) {
  write(STARTED_KEY(code), '1');
}
