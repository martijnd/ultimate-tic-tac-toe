<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { Game } from './models/Game';
import { Event } from './models/Event';
import { Board as BoardModel } from './models/Board';
import { Cell } from './models/Cell';
import { Player } from './models/Player';
import Board from './components/Board.vue';
import InstructionsDialog from './components/InstructionsDialog.vue';
import useSocketIO from './composables/Socket.io';
import { data } from './data';

const { socket } = useSocketIO();
const windowActive = ref(true);
const game = ref<Game | null>(null);
const SESSION_CODE = window.location.pathname.split('/')[1];
const currentUrl = ref('');
const clickedPlay = ref(false);
const copied = ref(false);
const playerConnected = ref(false);
const showInstructionsDialog = ref(false);

onMounted(() => {
  if (!SESSION_CODE) {
    window.location.href = `/${(Math.random() * 100000).toFixed(0)}`;
    return;
  }

  socket.emit(Event.Join, { code: SESSION_CODE });

  // Register event listeners
  socket.on(Event.Accepted, (player) => {
    game.value = new Game(player);

    socket.on(Event.PlaceMark, ({ code, boardIndex, cellIndex, player }) => {
      if (game.value && player !== game.value?.currentPlayer && SESSION_CODE === code) {
        const board = game.value?.boards.find(b => b.index === boardIndex);
        const cell = board?.cells.find(c => c.index === cellIndex);

        if (board && cell) {
          game.value.placeMark(board, cell, player);
        }
      }
    });

    socket.on(Event.Disconnected, () => {
      showErrorMessage('The opponent has disconnected');
      window.location.href = '/'
    });

    socket.on(Event.PlayerAccepted, () => {
      playerConnected.value = true;
    });
  });

  // Show "it's your turn!" message when tab is inactive
  document.addEventListener('visibilitychange', () => {
    windowActive.value = !document.hidden;
    if (!document.hidden) {
      document.title = 'Ultimate Tic Tac Toe';
    }
  });

  currentUrl.value = document.location.href;
});

watch(() => game.value?.activePlayer, () => {
  if (game.value?.activePlayer === game.value?.currentPlayer && !windowActive.value) {
    document.title = "It's your turn!";
  }
});

function onMarked(board: BoardModel, cell: Cell) {
  // If you're not the active player
  if (game.value?.activePlayer !== game.value?.currentPlayer) {
    // TODO: Show an error message
    return;
  }
  game.value?.placeMark(board, cell, game.value?.currentPlayer);
  socket.emit('place-mark', {
    code: SESSION_CODE,
    boardIndex: board.index,
    cellIndex: cell.index,
    player: game.value?.currentPlayer
  });
}

function onClickPlayButton() {
  clickedPlay.value = true;
}

async function onClickCopyButton() {
  await navigator.clipboard.writeText(currentUrl.value);
  copied.value = true;

  setTimeout(() => {
    copied.value = false;
  }, 3000);
}

function showErrorMessage(message: string) {
  alert(message);
}

function onClickPlayAgain() {
  if (game.value) {
    game.value = new Game(game.value.currentPlayer);
  }
}
function onClickShowInstructions() {
  showInstructionsDialog.value = true;
}
</script>

<template>
  <div class="relative h-screen w-screen bg-zinc-700 flex flex-col">
    <InstructionsDialog
      :show="showInstructionsDialog"
      @close="showInstructionsDialog = false"
    />
    <div class="grid place-items-center flex-grow p-2">
      <div>
        <h1
          class="text-center mb-8 text-neutral-100 font-bold text-3xl sm:text-4xl md:text-5xl font-slab"
        >Ultimate Tic Tac Toe</h1>
        <div v-if="clickedPlay && game">
          <div class="text-white font-bold text-center text-4xl mb-4">
            <template v-if="game.winner">
              {{ `Player ${game.winner} won!` }}
              <button
                @click="onClickPlayAgain"
                class="underline"
              >Play again</button>
            </template>
          </div>
          <div
            :class="`grid grid-rows-3 grid-cols-3 select-none gap-2 ${game.winner ? 'pointer-events-none bg-transparent/50' : ''}`"
          >
            <Board
              v-for="board of game.boards"
              :data="board"
              :active="game.availableBoards.map(board => board.index).includes(board.index)"
              :available="game.availableBoards.includes(board)"
              @marked="(cell) => onMarked(board, cell)"
            ></Board>
          </div>
          <div class="flex justify-between text-white mt-2">
            <div>Move {{ game.moveCount }}</div>
            <div
              :class="`font-bold ${game.activePlayer === game.currentPlayer ? 'text-green-300' : 'text-indigo-300'}`"
            >{{ game.activePlayer === game.currentPlayer ? `Your turn — you are ${game.currentPlayer}` : 'Waiting for opponent...' }}</div>
          </div>
        </div>
        <div v-else-if="game">
          <div
            class="p-4 sm:p-8 bg-zinc-800 rounded-lg shadow border-2 border-gray-700 flex flex-col space-y-8"
          >
            <h2
              class="text-white text-center text-xl font-bold"
            >{{ `You are ${game.currentPlayer}` }}</h2>
            <button
              class="italic underline text-white"
              @click="onClickShowInstructions"
            >How to play Ultimate Tic Tac Toe?</button>
            <div
              v-if="game.currentPlayer === Player.X"
              class="text-center flex flex-col md:block"
            >
              <h2
                class="text-white text-center text-lg mb-4"
              >Invite a friend to play</h2>
              <button
                class="border border-zinc-600 font-bold px-4 py-2 rounded w-full text-white hover:bg-zinc-600 active:bg-zinc-700"
                @click="onClickCopyButton"
              >{{ copied ? 'Copied!' : 'Copy link' }}</button>
            </div>
            <button
              @click="onClickPlayButton"
              class="block bg-zinc-500 font-semibold px-4 py-4 rounded text-white disabled:bg-gray-400 disabled:cursor-not-allowed hover:bg-zinc-600 active:bg-zinc-700"
              :disabled="!playerConnected && game.currentPlayer === Player.X"
            >{{ playerConnected || game.currentPlayer !== Player.X ? 'Play!' : 'Waiting for player...' }}</button>
          </div>
        </div>
        <div
          v-else
          class="text-white text-center font-bold text-lg"
        >Gathering X's and O's...</div>
      </div>
    </div>
    <footer
      class="p-2 text-center text-zinc-500 font-slab border-t-2 border-zinc-600"
    >
      Made by
      <a
        href="https://martijndorsman.nl"
        target="_blank"
        class="underline"
      >Martijn Dorsman</a>
    </footer>
  </div>
</template>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
}
</style>
