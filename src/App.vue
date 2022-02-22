<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { Game } from './models/Game';
import { Event } from './enums/Event';
import { Board as BoardModel } from './models/Board';
import { Cell } from './models/Cell';
import useSocketIO from './composables/Socket.io';
import { data } from './data';
import TicTacToe from './components/TicTacToe.vue';
import Lobby from './components/Lobby.vue';

const { socket } = useSocketIO();
const windowActive = ref(true);
const game = ref<Game | null>(null);
const SESSION_CODE = window.location.pathname.split('/')[1];
const clickedPlay = ref(false);
const playerConnected = ref(false);

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
      showErrorMessage('The opponent has disconnected');
      window.location.href = '/'
    });

    socket.on(Event.PlayerAccepted, () => {
      playerConnected.value = true;
    });
  });

  document.addEventListener('visibilitychange', () => {
    windowActive.value = !document.hidden;
    if (!document.hidden) {
      document.title = 'Ultimate Tic Tac Toe';
    }
  });
});

// Show "it's your turn!" message when tab is inactive
watch(() => game.value?.activePlayer, () => {
  if (game.value?.activePlayer === game.value?.currentPlayer && !windowActive.value) {
    document.title = "It's your turn!";
  }
});

function onMarked(board: BoardModel, cell: Cell) {
  if (!game.value) return;
  // If you're not the active player
  if (game.value.activePlayer !== game.value.currentPlayer) return;

  game.value.placeMark(board, cell, game.value.currentPlayer);
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

function onClickPlayAgain() {
  if (game.value) {
    game.value = new Game(game.value.currentPlayer);
  }
}

function showErrorMessage(message: string) {
  alert(message);
}
</script>

<template>
  <div class="relative h-screen w-screen bg-zinc-700 flex flex-col">
    <div class="grid place-items-center flex-grow p-2">
      <div>
        <h1
          class="text-center mb-8 text-neutral-100 font-bold text-3xl sm:text-4xl md:text-5xl font-slab"
        >Ultimate Tic Tac Toe</h1>
        <TicTacToe
          v-if="clickedPlay && game"
          :game="game"
          @play-again="onClickPlayAgain"
          @marked="onMarked"
        />
        <div v-else-if="game">
          <Lobby
            :game="game"
            :connected="playerConnected"
            @play="onClickPlayButton"
          />
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
