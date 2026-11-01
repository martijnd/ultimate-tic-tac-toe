<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import confetti from 'canvas-confetti';
import { Game } from './models/Game';
import { Event } from './enums/Event';
import { Player } from './enums/Player';
import { Board as BoardModel } from './models/Board';
import { Cell } from './models/Cell';
import useSocketIO from './composables/Socket.io';
import { POSITIONS, boardName } from './positions';
import TicTacToe from './components/TicTacToe.vue';
import Lobby from './components/Lobby.vue';
import GameStatus from './components/GameStatus.vue';
import InstructionsDialog from './components/InstructionsDialog.vue';

const TITLE = 'Ultimate Tic Tac Toe';
// The server ignores joins to a room that already has two players, so no answer means "full".
const JOIN_TIMEOUT_MS = 5000;

const { socket } = useSocketIO();
const windowActive = ref(true);
const game = ref<Game | null>(null);
const SESSION_CODE = window.location.pathname.split('/')[1];
const clickedPlay = ref(false);
const playerConnected = ref(false);
const opponentLeft = ref(false);
const roomFull = ref(false);
const serverUnreachable = ref(false);
const showInstructions = ref(false);
const announcement = ref('');
let joinTimer: number | undefined;

type Phase = 'connecting' | 'offline' | 'full' | 'lobby' | 'playing' | 'left';

const phase = computed<Phase>(() => {
  if (opponentLeft.value) return 'left';
  if (game.value && clickedPlay.value) return 'playing';
  if (game.value) return 'lobby';
  if (roomFull.value) return 'full';
  if (serverUnreachable.value) return 'offline';
  return 'connecting';
});

function onVisibilityChange() {
  windowActive.value = !document.hidden;
  if (!document.hidden) {
    document.title = TITLE;
  }
}

onMounted(() => {
  if (!SESSION_CODE) {
    window.location.href = `/${(Math.random() * 100000).toFixed(0)}`;
    return;
  }

  socket.on('connect', () => {
    serverUnreachable.value = false;
    window.clearTimeout(joinTimer);
    if (!game.value) {
      joinTimer = window.setTimeout(() => {
        if (!game.value) roomFull.value = true;
      }, JOIN_TIMEOUT_MS);
    }
  });

  socket.on('connect_error', () => {
    serverUnreachable.value = true;
  });

  socket.on(Event.Accepted, (player: Player) => {
    window.clearTimeout(joinTimer);
    roomFull.value = false;
    game.value = new Game(player);
  });

  socket.on(Event.PlaceMark, ({ code, boardIndex, cellIndex, player }) => {
    if (!game.value || SESSION_CODE !== code) return;

    if (player !== game.value.currentPlayer) {
      const board = game.value.boards.find(b => b.index === boardIndex);
      const cell = board?.cells.find(c => c.index === cellIndex);

      if (board && cell) {
        game.value.placeMark(board, cell, player);
      }
    }
  });

  socket.on(Event.Disconnected, () => {
    opponentLeft.value = true;
    announcement.value = 'Your friend left the game.';
  });

  socket.on(Event.PlayerAccepted, () => {
    playerConnected.value = true;
    if (game.value?.currentPlayer === Player.X) {
      announcement.value = 'Your friend has joined. You can start the game.';
    }
  });

  socket.emit(Event.Join, { code: SESSION_CODE });

  document.addEventListener('visibilitychange', onVisibilityChange);
});

onBeforeUnmount(() => {
  window.clearTimeout(joinTimer);
  document.removeEventListener('visibilitychange', onVisibilityChange);
});

// Show "it's your turn!" message when tab is inactive
watch(() => game.value?.activePlayer, () => {
  if (game.value?.activePlayer === game.value?.currentPlayer && !windowActive.value) {
    document.title = "It's your turn!";
  }
});

// Announce every move for screen reader users, including where to play next.
watch(() => game.value?.moveCount, () => {
  const g = game.value;
  if (!g || !g.lastMove) return;
  const { boardIndex, cellIndex, player } = g.lastMove;
  const who = player === g.currentPlayer ? 'You' : 'Your friend';
  const parts = [`${who} played ${POSITIONS[cellIndex]} in the ${boardName(boardIndex)}.`];

  if (g.winner) {
    parts.push(g.winner === g.currentPlayer ? 'You won the game!' : 'Your friend won the game.');
  } else if (g.draw) {
    parts.push("It's a draw.");
  } else if (g.activePlayer === g.currentPlayer) {
    const boards = g.availableBoards;
    parts.push(boards.length === 1 ? `Your move, in the ${boardName(boards[0].index)}.` : 'Your move, in any open board.');
  }
  announcement.value = parts.join(' ');
});

// Celebrate when you win. Only fires once per game, and not at all with reduced motion.
watch(() => game.value?.winner, (winner) => {
  if (!winner || winner !== game.value?.currentPlayer) return;
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
});

function onMarked(board: BoardModel, cell: Cell) {
  if (!game.value || phase.value !== 'playing') return;
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
}

function onClickPlayButton() {
  clickedPlay.value = true;
}

function onClickPlayAgain() {
  if (game.value) {
    game.value = new Game(game.value.currentPlayer);
    announcement.value = game.value.currentPlayer === Player.X ? 'New game. Your move.' : 'New game. Your friend moves first.';
  }
}

function startNewGame() {
  window.location.href = '/';
}

// An empty board to show behind the lobby and loading states
const placeholderGame = new Game(Player.X);
const boardGame = computed(() => game.value ?? placeholderGame);
</script>

<template>
  <div class="app" :class="`app--${phase}`">
    <a class="skip-link" href="#main">Skip to game</a>

    <header class="topbar">
      <div class="brand">
        <svg class="brand__mark" viewBox="0 0 64 64" aria-hidden="true" focusable="false">
          <path class="brand__grid" d="M23 6 C 22 24, 24 40, 22 58 M43 6 C 42 24, 44 40, 42 58 M6 22 C 24 23, 40 21, 58 22 M6 43 C 24 42, 40 44, 58 42" />
          <path class="brand__x" d="M9 7 L 17 16 M17 7 L 9 16" />
          <circle class="brand__o" cx="32.5" cy="32.5" r="4.5" />
        </svg>
        <h1 class="brand__title">Ultimate tic-tac-toe</h1>
      </div>
      <button type="button" class="btn btn--quiet" aria-haspopup="dialog" @click="showInstructions = true">
        How to play
      </button>
    </header>

    <main id="main" class="stage" tabindex="-1">
      <aside class="panel" aria-label="Game status">
        <GameStatus v-if="phase === 'playing' && game" :game="game" @play-again="onClickPlayAgain" />

        <Lobby
          v-else-if="phase === 'lobby' && game"
          :game="game"
          :connected="playerConnected"
          @play="onClickPlayButton"
        />

        <section v-else-if="phase === 'left'" class="notice" aria-labelledby="notice-title">
          <h2 id="notice-title" class="notice__title">Your friend left the game</h2>
          <p class="notice__body">This game can't continue. Start a new one and send your friend the new link.</p>
          <a class="btn btn--primary btn--block" href="/">Start a new game</a>
        </section>

        <section v-else-if="phase === 'full'" class="notice" aria-labelledby="notice-title">
          <h2 id="notice-title" class="notice__title">This game already has two players</h2>
          <p class="notice__body">Start your own game and invite a friend to it.</p>
          <button type="button" class="btn btn--primary btn--block" @click="startNewGame">Start a new game</button>
        </section>

        <section v-else-if="phase === 'offline'" class="notice" aria-labelledby="notice-title" role="alert">
          <h2 id="notice-title" class="notice__title">Can't reach the game server</h2>
          <p class="notice__body">Check your internet connection. We'll keep trying to connect.</p>
        </section>

        <section v-else class="notice" aria-labelledby="notice-title" aria-busy="true">
          <h2 id="notice-title" class="notice__title">Setting up the board…</h2>
          <p class="notice__body">Connecting to the game server.</p>
        </section>
      </aside>

      <div class="board-area">
        <TicTacToe :game="boardGame" :interactive="phase === 'playing'" @marked="onMarked" />
      </div>
    </main>

    <footer class="footer">Made by Martijn</footer>

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
  white-space: nowrap;
}

.topbar .btn {
  flex: none;
  white-space: nowrap;
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
  grid-area: board;
  padding: clamp(10px, 2.2vw, 24px);
  border-radius: calc(var(--radius-sheet) + 4px);
  background: var(--surface);
  border: 1.5px solid var(--rule);
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

</style>
