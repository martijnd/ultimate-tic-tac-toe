<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import confetti from 'canvas-confetti';
import { Game } from './models/Game';
import { Event } from './enums/Event';
import { Player } from './enums/Player';
import { Board as BoardModel } from './models/Board';
import { Cell } from './models/Cell';
import useSocketIO from './composables/Socket.io';
import { hasStarted, markStarted, playerToken } from './composables/session';
import { playJoinSound, playMoveSound, playReactionSound } from './composables/sounds';
import { REACTIONS, REACTION_COOLDOWN_MS, type Reaction } from './reactions';
import { t } from './i18n';
import TicTacToe from './components/TicTacToe.vue';
import Lobby from './components/Lobby.vue';
import GameStatus from './components/GameStatus.vue';
import InstructionsDialog from './components/InstructionsDialog.vue';
import { tapZoom } from './composables/settings';
import LanguageSwitch from './components/LanguageSwitch.vue';

// Fallback in case the server never answers a join; it normally says "full" itself.
const JOIN_TIMEOUT_MS = 5000;
// After this long without the other player, offer to start a new game.
const OTHER_GONE_MS = 60_000;

// Room codes are six-digit numbers without a leading zero; the server refuses anything else.
// Keep in sync with backend/rooms.js.
const isRoomCode = (code: string) => /^[1-9]\d{5}$/.test(code);
const newRoomCode = () => String(100000 + Math.floor(Math.random() * 900000));

type Move = { boardIndex: number; cellIndex: number; player: Player };
type ResumeState = {
  player: Player;
  games: Move[][];
  rematch: Record<Player, boolean>;
  otherJoined: boolean;
  otherOnline: boolean;
};
type Result = 'you' | 'them' | 'draw';

const { socket } = useSocketIO();
const windowActive = ref(true);
const game = ref<Game | null>(null);
const SESSION_CODE = window.location.pathname.split('/')[1];
const clickedPlay = ref(SESSION_CODE ? hasStarted(SESSION_CODE) : false);
/** The other player has a seat and is connected right now. */
const playerConnected = ref(false);
const roomFull = ref(false);
const serverUnreachable = ref(false);
/** This tab's own connection to the server is down (after having joined). */
const connectionLost = ref(false);
/** This seat was taken over by another tab. */
const replaced = ref(false);
/** The other player had joined but their connection dropped. */
const otherOffline = ref(false);
const otherGone = ref(false);
const showInstructions = ref(false);
const announcement = ref('');
// The tab title says "It's your turn!" while the tab is in the background and you're up.
const turnTitleShown = ref(false);
let joinTimer: number | undefined;
let otherGoneTimer: number | undefined;

// Session score across rematches. The starting player alternates each game: X opens game 1, O game 2, …
const round = ref(0);
const pastResults = ref<Result[]>([]);
const starterFor = (n: number) => (n % 2 === 0 ? Player.X : Player.O);
const nextStarter = computed(() => starterFor(round.value + 1));

function resultOf(g: Game): Result | null {
  if (g.winner) return g.winner === g.currentPlayer ? 'you' : 'them';
  return g.draw ? 'draw' : null;
}

const score = computed(() => {
  const current = game.value ? resultOf(game.value) : null;
  const all = current ? [...pastResults.value, current] : pastResults.value;
  return {
    you: all.filter(r => r === 'you').length,
    them: all.filter(r => r === 'them').length,
    draws: all.filter(r => r === 'draw').length,
  };
});

// Rematch handshake: the next game starts once both players pressed "Play again".
const wantsRematch = ref(false);
const otherWantsRematch = ref(false);
const rematch = computed(() => (wantsRematch.value ? 'you' : otherWantsRematch.value ? 'them' : 'none'));

// The latest reaction from each side; `id` changes on every reaction so the bubble re-animates.
type ShownReaction = { emoji: Reaction; id: number };
const yourReaction = ref<ShownReaction | null>(null);
const theirReaction = ref<ShownReaction | null>(null);
let reactionId = 0;
const BURST = 7;
let lastReactionAt = 0;

type Phase = 'connecting' | 'offline' | 'full' | 'replaced' | 'lobby' | 'playing';

const phase = computed<Phase>(() => {
  if (replaced.value) return 'replaced';
  if (game.value && clickedPlay.value) return 'playing';
  if (game.value) return 'lobby';
  if (roomFull.value) return 'full';
  if (serverUnreachable.value) return 'offline';
  return 'connecting';
});

/** Shown above the game or lobby while either side is disconnected. */
const connectionMessage = computed(() => {
  const c = t.value.connection;
  if (connectionLost.value) return c.youOffline;
  if (otherOffline.value) return otherGone.value ? c.otherGone : c.otherOffline;
  return '';
});

function onVisibilityChange() {
  windowActive.value = !document.hidden;
  if (!document.hidden) {
    turnTitleShown.value = false;
  }
}

watch(
  [turnTitleShown, t],
  () => {
    document.title = turnTitleShown.value ? t.value.yourTurnTitle : t.value.documentTitle;
  },
  { immediate: true }
);

// The browser knows right away when the network goes; don't wait for the socket heartbeat to time out.
function onBrowserOffline() {
  if (socket.connected) socket.disconnect();
}

function onBrowserOnline() {
  if (!replaced.value && socket.disconnected) socket.connect();
}

function setOtherOffline(offline: boolean) {
  otherOffline.value = offline;
  otherGone.value = false;
  window.clearTimeout(otherGoneTimer);
  if (offline) otherGoneTimer = window.setTimeout(() => (otherGone.value = true), OTHER_GONE_MS);
}

function replay(me: Player, moves: Move[], starter: Player) {
  const g = new Game(me, undefined, starter);
  for (const { boardIndex, cellIndex, player } of moves) {
    const board = g.boards[boardIndex];
    const cell = board?.cells[cellIndex];
    if (board && cell) g.placeMark(board, cell, player);
  }
  return g;
}

/** Rebuild everything from the server's copy of the room, after joining or reconnecting. */
function restore(state: ResumeState) {
  const games = state.games.length ? state.games : [[]];
  const replayed = games.map((moves, i) => replay(state.player, moves, starterFor(i)));
  pastResults.value = replayed.slice(0, -1).map(g => resultOf(g) ?? 'draw');
  round.value = games.length - 1;
  game.value = replayed[replayed.length - 1];

  const them = state.player === Player.X ? Player.O : Player.X;
  wantsRematch.value = state.rematch[state.player];
  otherWantsRematch.value = state.rematch[them];
  playerConnected.value = state.otherOnline;
  setOtherOffline(state.otherJoined && !state.otherOnline);
  // Anything already played means both players are past the lobby
  if (games.length > 1 || games[0].length > 0) clickedPlay.value = true;
}

onMounted(() => {
  if (!isRoomCode(SESSION_CODE)) {
    window.location.href = `/${newRoomCode()}`;
    return;
  }
  const token = playerToken(SESSION_CODE);

  // Fires on the first connection and on every automatic reconnect; (re)join each time.
  socket.on('connect', () => {
    serverUnreachable.value = false;
    window.clearTimeout(joinTimer);
    if (!game.value) {
      joinTimer = window.setTimeout(() => {
        if (!game.value) roomFull.value = true;
      }, JOIN_TIMEOUT_MS);
    }
    socket.emit(Event.Join, { code: SESSION_CODE, token });
  });

  socket.on('connect_error', () => {
    if (!game.value) serverUnreachable.value = true;
  });

  socket.on('disconnect', (reason: string) => {
    // The server closed this socket on purpose, because the game was opened in another tab
    if (reason === 'io server disconnect') return;
    if (game.value) {
      connectionLost.value = true;
      announcement.value = t.value.connection.youOffline;
    }
  });

  socket.on(Event.Replaced, () => {
    replaced.value = true;
  });

  socket.on(Event.Full, () => {
    window.clearTimeout(joinTimer);
    roomFull.value = true;
  });

  socket.on(Event.Accepted, (player: Player) => {
    window.clearTimeout(joinTimer);
    roomFull.value = false;
    if (!game.value || game.value.currentPlayer !== player) game.value = new Game(player);
  });

  socket.on(Event.Resume, (state: ResumeState) => {
    const wasLost = connectionLost.value;
    connectionLost.value = false;
    restore(state);
    if (wasLost) announcement.value = t.value.announce.reconnected;
  });

  socket.on(Event.PlaceMark, ({ code, boardIndex, cellIndex, player }) => {
    if (!game.value || SESSION_CODE !== code) return;

    if (player !== game.value.currentPlayer) {
      const board = game.value.boards.find(b => b.index === boardIndex);
      const cell = board?.cells.find(c => c.index === cellIndex);

      if (board && cell) {
        game.value.placeMark(board, cell, player);
        playMoveSound();
      }
    }
  });

  socket.on(Event.Rematch, ({ code }: { code: string }) => {
    if (code !== SESSION_CODE || !game.value?.over) return;
    otherWantsRematch.value = true;
    if (!wantsRematch.value) {
      playJoinSound();
      announcement.value = t.value.announce.otherWantsRematch;
    }
    maybeStartRematch();
  });

  socket.on(Event.Reaction, ({ code, emoji }: { code: string; emoji: Reaction }) => {
    if (code !== SESSION_CODE || !REACTIONS.includes(emoji)) return;
    theirReaction.value = { emoji, id: ++reactionId };
    playReactionSound();
    announcement.value = t.value.announce.otherReacted(t.value.reactions.names[REACTIONS.indexOf(emoji)]);
  });

  socket.on(Event.OpponentOffline, () => {
    playerConnected.value = false;
    setOtherOffline(true);
    announcement.value = t.value.announce.otherOffline;
  });

  socket.on(Event.OpponentOnline, () => {
    playerConnected.value = true;
    setOtherOffline(false);
    announcement.value = t.value.announce.otherBack;
  });

  socket.on(Event.PlayerAccepted, () => {
    playerConnected.value = true;
    setOtherOffline(false);
    if (game.value?.currentPlayer === Player.X) {
      playJoinSound();
      announcement.value = t.value.announce.otherJoined;
    }
  });

  document.addEventListener('visibilitychange', onVisibilityChange);
  window.addEventListener('offline', onBrowserOffline);
  window.addEventListener('online', onBrowserOnline);
});

onBeforeUnmount(() => {
  window.clearTimeout(joinTimer);
  window.clearTimeout(otherGoneTimer);
  document.removeEventListener('visibilitychange', onVisibilityChange);
  window.removeEventListener('offline', onBrowserOffline);
  window.removeEventListener('online', onBrowserOnline);
});

// Show "it's your turn!" message when tab is inactive
watch(() => game.value?.activePlayer, () => {
  if (game.value?.activePlayer === game.value?.currentPlayer && !windowActive.value) {
    turnTitleShown.value = true;
  }
});

// Announce every move for screen reader users, including where to play next.
watch(() => game.value?.moveCount, () => {
  const g = game.value;
  if (!g || !g.lastMove) return;
  const { boardIndex, cellIndex, player } = g.lastMove;
  const a = t.value.announce;
  const parts = [a.move(player === g.currentPlayer, cellIndex, boardIndex)];

  if (g.winner) {
    parts.push(g.winner === g.currentPlayer ? a.youWon : a.otherWon);
  } else if (g.draw) {
    parts.push(a.draw);
  } else if (g.activePlayer === g.currentPlayer) {
    const boards = g.availableBoards;
    parts.push(boards.length === 1 ? a.yourMoveIn(boards[0].index) : a.yourMoveAnywhere);
  }
  announcement.value = parts.join(' ');
});

// Celebrate when your move wins the game. Not when a finished game is restored, and not with reduced motion.
function celebrate() {
  const styles = getComputedStyle(document.documentElement);
  confetti({
    particleCount: 140,
    spread: 80,
    origin: { y: 0.6 },
    colors: [
      styles.getPropertyValue('--x').trim() || '#2346d1',
      styles.getPropertyValue('--o').trim() || '#c8243b',
      styles.getPropertyValue('--highlight').trim() || '#ffe45c',
    ],
    disableForReducedMotion: true,
  });
}

/** You can place marks: in a game, connected, and not taken over by another tab. */
const canPlay = computed(() => phase.value === 'playing' && !connectionLost.value);

function onMarked(board: BoardModel, cell: Cell) {
  if (!game.value || !canPlay.value) return;
  // If you're not the active player
  if (game.value.activePlayer !== game.value.currentPlayer) return;

  const before = game.value.moveCount;
  game.value.placeMark(board, cell, game.value.currentPlayer);
  // placeMark ignores illegal moves; only tell the opponent about real ones
  if (game.value.moveCount === before) return;

  socket.emit(Event.PlaceMark, {
    code: SESSION_CODE,
    boardIndex: board.index,
    cellIndex: cell.index,
    player: game.value.currentPlayer,
  });
  if (game.value.winner === game.value.currentPlayer) celebrate();
}

function onClickPlayButton() {
  clickedPlay.value = true;
  markStarted(SESSION_CODE);
}

function onClickPlayAgain() {
  if (!game.value?.over || wantsRematch.value || connectionLost.value) return;
  wantsRematch.value = true;
  socket.emit(Event.Rematch, { code: SESSION_CODE });
  maybeStartRematch();
}

function maybeStartRematch() {
  if (!game.value || !wantsRematch.value || !otherWantsRematch.value) return;
  wantsRematch.value = false;
  otherWantsRematch.value = false;
  pastResults.value = [...pastResults.value, resultOf(game.value) ?? 'draw'];
  round.value++;
  const starter = starterFor(round.value);
  game.value = new Game(game.value.currentPlayer, undefined, starter);
  announcement.value =
    starter === game.value.currentPlayer ? t.value.announce.newGameYouFirst : t.value.announce.newGameOtherFirst;
}

function onReact(emoji: Reaction) {
  if (connectionLost.value) return;
  const now = Date.now();
  if (now - lastReactionAt < REACTION_COOLDOWN_MS) return;
  lastReactionAt = now;
  yourReaction.value = { emoji, id: ++reactionId };
  socket.emit(Event.Reaction, { code: SESSION_CODE, emoji });
}

function startNewGame() {
  window.location.href = '/';
}

function playHere() {
  window.location.reload();
}

// An empty board to show behind the lobby and loading states
const placeholderGame = new Game(Player.X);
const boardGame = computed(() => game.value ?? placeholderGame);
</script>

<template>
  <div class="app" :class="`app--${phase}`">
    <a class="skip-link" href="#main">{{ t.skipToGame }}</a>

    <header class="topbar">
      <div class="brand">
        <svg class="brand__mark" viewBox="0 0 64 64" aria-hidden="true" focusable="false">
          <path class="brand__grid" d="M23 6 C 22 24, 24 40, 22 58 M43 6 C 42 24, 44 40, 42 58 M6 22 C 24 23, 40 21, 58 22 M6 43 C 24 42, 40 44, 58 42" />
          <path class="brand__x" d="M9 7 L 17 16 M17 7 L 9 16" />
          <circle class="brand__o" cx="32.5" cy="32.5" r="4.5" />
        </svg>
        <h1 class="brand__title">{{ t.title }}</h1>
      </div>
      <div class="topbar__actions">
        <LanguageSwitch />
        <button type="button" class="btn btn--quiet help-button" aria-haspopup="dialog" @click="showInstructions = true">
          <svg class="help-button__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M9.2 9.1a2.9 2.9 0 0 1 5.6 1c0 1.9-2.8 2.5-2.8 4.4" />
            <circle cx="12" cy="18.3" r="0.6" />
          </svg>
          <span class="help-button__text">{{ t.howToPlay }}</span>
        </button>
      </div>
    </header>

    <main id="main" class="stage" tabindex="-1">
      <aside class="panel" :aria-label="t.gameStatus">
        <div
          v-if="connectionMessage && (phase === 'playing' || phase === 'lobby')"
          class="connection"
          :class="{ 'connection--you': connectionLost }"
        >
          <span class="connection__dot" aria-hidden="true" />
          <p class="connection__text">{{ connectionMessage }}</p>
          <a v-if="otherGone && !connectionLost" class="btn btn--secondary connection__new" href="/">{{ t.startNewGame }}</a>
        </div>

        <GameStatus
          v-if="phase === 'playing' && game"
          :game="game"
          :score="score"
          :rematch="rematch"
          :you-start-next="nextStarter === game.currentPlayer"
          :your-reaction="yourReaction"
          :their-reaction="theirReaction"
          @play-again="onClickPlayAgain"
          @react="onReact"
        />

        <Lobby
          v-else-if="phase === 'lobby' && game"
          :game="game"
          :connected="playerConnected"
          @play="onClickPlayButton"
        />

        <section v-else-if="phase === 'replaced'" class="notice" aria-labelledby="notice-title">
          <h2 id="notice-title" class="notice__title">{{ t.notice.replacedTitle }}</h2>
          <p class="notice__body">{{ t.notice.replacedBody }}</p>
          <button type="button" class="btn btn--primary btn--block" @click="playHere">{{ t.notice.playHere }}</button>
        </section>

        <section v-else-if="phase === 'full'" class="notice" aria-labelledby="notice-title">
          <h2 id="notice-title" class="notice__title">{{ t.notice.fullTitle }}</h2>
          <p class="notice__body">{{ t.notice.fullBody }}</p>
          <button type="button" class="btn btn--primary btn--block" @click="startNewGame">{{ t.startNewGame }}</button>
        </section>

        <section v-else-if="phase === 'offline'" class="notice" aria-labelledby="notice-title" role="alert">
          <h2 id="notice-title" class="notice__title">{{ t.notice.offlineTitle }}</h2>
          <p class="notice__body">{{ t.notice.offlineBody }}</p>
        </section>

        <section v-else class="notice" aria-labelledby="notice-title" aria-busy="true">
          <h2 id="notice-title" class="notice__title">{{ t.notice.connectingTitle }}</h2>
          <p class="notice__body">{{ t.notice.connectingBody }}</p>
        </section>
      </aside>

      <div class="board-area">
        <TicTacToe :game="boardGame" :interactive="canPlay" @marked="onMarked" />
        <label class="tap-zoom">
          <input v-model="tapZoom" type="checkbox" />
          {{ t.board.tapZoom }}
        </label>
        <!-- The other player's reaction pops up big over the board, with a little burst around it -->
        <div v-if="theirReaction && phase === 'playing'" :key="theirReaction.id" class="incoming" aria-hidden="true">
          <span
            v-for="i in BURST"
            :key="i"
            class="incoming__spark"
            :style="`--angle: ${(360 / BURST) * i + 15}deg`"
          >{{ theirReaction.emoji }}</span>
          <span class="incoming__emoji">{{ theirReaction.emoji }}</span>
        </div>
      </div>
    </main>

    <footer class="footer">{{ t.footer }}</footer>

    <p class="sr-only" aria-live="polite" aria-atomic="true">{{ announcement }}</p>

    <InstructionsDialog :show="showInstructions" @close="showInstructions = false" />
  </div>
</template>

<style>
.app {
  display: grid;
  grid-template-rows: auto 1fr auto;
  min-height: 100vh;
  min-height: 100svh;
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
}

.skip-link {
  position: absolute;
  left: 1rem;
  top: -100px;
  z-index: 10;
  padding: 0.75rem 1rem;
  border-radius: var(--radius-control);
  background: var(--ink);
  color: var(--paper);
  font-weight: 600;
}

.skip-link:focus {
  top: 1rem;
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: clamp(0.75rem, 2.5vw, 1.5rem) clamp(1rem, 4vw, 2.5rem);
}

.brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 0;
}

.brand__mark {
  flex: none;
  width: 40px;
  height: 40px;
  fill: none;
  stroke-linecap: round;
  stroke-width: 5;
}

.brand__grid {
  stroke: var(--ink);
}

.brand__x {
  stroke: var(--x);
}

.brand__o {
  stroke: var(--o);
}

.brand__title {
  margin: 0;
  font-size: clamp(var(--step-1), 2.6vw, var(--step-2));
  font-weight: 800;
  line-height: 1.1;
  letter-spacing: -0.025em;
  text-wrap: balance;
}

.topbar__actions {
  display: flex;
  flex: none;
  align-items: center;
  gap: 0.5rem;
}

.topbar .btn {
  white-space: nowrap;
}

.help-button__icon {
  display: none;
  width: 22px;
  height: 22px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2.25;
  stroke-linecap: round;
}

.help-button__icon circle {
  fill: currentColor;
}

@media (max-width: 479px) {
  .brand {
    gap: 0.5rem;
  }

  .brand__mark {
    width: 30px;
    height: 30px;
  }

  .brand__title {
    font-size: 1.125rem;
  }

  /* Icon-only on small phones; the text stays as the accessible name */
  /* .topbar prefix: index.css loads after this file, so .btn--quiet would otherwise win */
  .topbar .help-button {
    width: 44px;
    padding: 0;
  }

  .help-button__icon {
    display: block;
  }

  .help-button__text {
    position: absolute;
    width: 1px;
    height: 1px;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
  }
}

.stage {
  /* Fit the board in the viewport next to the panel, but never smaller than 360px (the page scrolls instead) */
  --board-size: min(max(calc(100vh - 270px), 360px), calc(100vw - 560px), 640px);
  --board-size: min(max(calc(100svh - 270px), 360px), calc(100vw - 560px), 640px);

  display: grid;
  grid-template-columns: auto minmax(280px, 360px);
  grid-template-areas: 'board panel';
  align-items: center;
  justify-content: center;
  gap: clamp(2rem, 5vw, 4rem);
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: clamp(0.5rem, 2vw, 1.5rem) clamp(1rem, 4vw, 2.5rem) clamp(1.5rem, 4vw, 3rem);
}

.stage:focus {
  outline: none;
}

.board-area {
  position: relative;
  grid-area: board;
  padding: clamp(10px, 2.2vw, 24px);
  border-radius: calc(var(--radius-sheet) + 4px);
  background: var(--surface);
  border: 1.5px solid var(--rule);
}

.tap-zoom {
  display: none;
  align-items: center;
  gap: 0.6rem;
  min-height: 44px;
  margin-top: 0.5rem;
  font-size: var(--step--1);
  color: var(--ink-soft);
}

.tap-zoom input {
  width: 1.25rem;
  height: 1.25rem;
  margin: 0;
  accent-color: var(--ink);
}

/* Only touch screens get tap-to-zoom, so only they get the switch */
@media (pointer: coarse) and (max-width: 700px) {
  .tap-zoom {
    display: flex;
  }
}

.panel {
  grid-area: panel;
  align-self: center;
  padding: clamp(1.25rem, 3vw, 2rem);
  border-radius: var(--radius-sheet);
  background: var(--surface);
  border: 1.5px solid var(--rule);
}

.notice {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.notice__title {
  margin: 0;
  font-size: var(--step-3);
  font-weight: 800;
  line-height: 1.1;
  letter-spacing: -0.02em;
}

.notice__body {
  margin: 0;
  color: var(--ink-soft);
  font-size: var(--step-1);
  line-height: 1.4;
}

.footer {
  padding: 1rem 1rem calc(1rem + env(safe-area-inset-bottom));
  text-align: center;
  font-size: var(--step--1);
  color: var(--ink-soft);
}

/* Stack on smaller screens: status on top so whose move it is stays in view */
@media (max-width: 959px) {
  .stage {
    --board-size: min(calc(100vw - 2rem - 27px), 560px);

    padding: 0.25rem 1rem 1.5rem;
    grid-template-columns: minmax(0, 1fr);
    grid-template-areas:
      'panel'
      'board';
    align-content: start;
    justify-items: center;
    gap: 1rem;
  }

  .panel {
    width: 100%;
    max-width: calc(560px + 24px);
    padding: 1rem 1.125rem;
  }

  .board-area {
    padding: 12px;
  }

  /* Before the game starts the empty board is just decoration; keep the lobby in focus */
  .app--lobby .board-area,
  .app--connecting .board-area,
  .app--offline .board-area,
  .app--full .board-area {
    display: none;
  }
}

@media (max-width: 959px) and (max-height: 560px) and (orientation: landscape) {
  .stage {
    --board-size: min(calc(100vh - 110px), 480px);
    --board-size: min(calc(100svh - 110px), 480px);

    grid-template-columns: auto minmax(220px, 1fr);
    grid-template-areas: 'board panel';
    align-items: start;
  }
}

/* Connection trouble, on either side. Not a live region itself; the announcement covers screen readers. */
.connection {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem 0.75rem;
  margin-bottom: 1.25rem;
  padding: 0.75rem 1rem;
  border: 1.5px dashed var(--ink-soft);
  border-radius: var(--radius-control);
}

.connection--you {
  border-style: solid;
  border-color: var(--danger);
}

.connection__dot {
  flex: none;
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: var(--ink-soft);
  animation: connection-blink 1.2s ease-in-out infinite;
}

.connection--you .connection__dot {
  background: var(--danger);
}

.connection__text {
  flex: 1;
  min-width: 12rem;
  margin: 0;
  line-height: 1.35;
}

.connection__new {
  width: 100%;
}

@keyframes connection-blink {
  50% {
    opacity: 0.25;
  }
}

/* Incoming reaction: a big emoji that pops, wobbles, floats up and fades, plus small sparks flying out */
.incoming {
  position: absolute;
  left: 50%;
  top: 55%;
  z-index: 4;
  width: 0;
  height: 0;
  pointer-events: none;
}

.incoming__emoji,
.incoming__spark {
  position: absolute;
  left: 0;
  top: 0;
  line-height: 1;
  opacity: 0;
}

.incoming__emoji {
  font-size: clamp(5rem, 22vmin, 9rem);
  filter: drop-shadow(0 10px 18px rgba(15, 30, 54, 0.28));
  animation: incoming-pop 2.6s cubic-bezier(0.2, 0.8, 0.3, 1) forwards;
}

.incoming__spark {
  font-size: clamp(1.25rem, 4.5vmin, 2rem);
  animation: incoming-spark 1.1s cubic-bezier(0.1, 0.7, 0.3, 1) 120ms forwards;
}

@keyframes incoming-pop {
  0% {
    opacity: 0;
    transform: translate(-50%, -20%) scale(0.2);
  }
  14% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1.25) rotate(-8deg);
  }
  24% {
    transform: translate(-50%, -50%) scale(0.95) rotate(6deg);
  }
  34% {
    transform: translate(-50%, -50%) scale(1.05) rotate(-3deg);
  }
  44%,
  70% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1) rotate(0);
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -130%) scale(0.9);
  }
}

@keyframes incoming-spark {
  0% {
    opacity: 0;
    transform: translate(-50%, -50%) rotate(var(--angle)) translateY(0) rotate(calc(-1 * var(--angle))) scale(0.4);
  }
  20% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -50%) rotate(var(--angle)) translateY(clamp(-14rem, -36vmin, -7rem)) rotate(calc(-1 * var(--angle))) scale(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  /* No pop or burst: just show the emoji for a moment and fade it out */
  .incoming__spark {
    display: none;
  }

  .incoming__emoji {
    animation: incoming-fade 2.4s linear forwards !important;
  }
}

@keyframes incoming-fade {
  0%,
  75% {
    opacity: 1;
    transform: translate(-50%, -50%);
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -50%);
  }
}

</style>
