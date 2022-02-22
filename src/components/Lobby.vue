<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { Game } from '../models/Game';
import { Player } from '../enums/Player';
import InstructionsDialog from './InstructionsDialog.vue';

const currentUrl = ref('');
const copied = ref(false);
const showInstructionsDialog = ref(false);

onMounted(() => {
  currentUrl.value = document.location.href;
})

defineProps({
  game: {
    type: Object as () => Game,
    required: true
  },
  connected: {
    type: Boolean,
    required: true
  },
})

const emit = defineEmits(['play']);

function onClickShowInstructionsButton() {
  showInstructionsDialog.value = true;
}

async function onClickCopyButton() {
  await navigator.clipboard.writeText(currentUrl.value);
  copied.value = true;

  setTimeout(() => {
    copied.value = false;
  }, 3000);
}

</script>

<template>
  <InstructionsDialog
    :show="showInstructionsDialog"
    @close="showInstructionsDialog = false"
  />
  <div
    class="p-4 sm:p-8 bg-zinc-800 rounded-lg shadow border-2 border-gray-700 flex flex-col space-y-8"
  >
    <h2
      class="text-white text-center text-xl font-bold"
    >{{ `You are ${game.currentPlayer}` }}</h2>
    <button
      class="italic underline text-white"
      @click="onClickShowInstructionsButton"
    >How to play Ultimate Tic Tac Toe?</button>
    <div
      v-if="game.currentPlayer === Player.X"
      class="text-center flex flex-col md:block"
    >
      <h2 class="text-white text-center text-lg mb-4">Invite a friend to play</h2>
      <button
        class="border border-zinc-600 font-bold px-4 py-2 rounded w-full text-white hover:bg-zinc-600 active:bg-zinc-700"
        @click="onClickCopyButton"
      >{{ copied ? 'Copied!' : 'Copy link' }}</button>
    </div>
    <button
      @click="emit('play')"
      class="block bg-zinc-500 font-semibold px-4 py-4 rounded text-white disabled:bg-gray-400 disabled:cursor-not-allowed hover:bg-zinc-600 active:bg-zinc-700"
      :disabled="!connected && game.currentPlayer === Player.X"
    >{{ connected || game.currentPlayer !== Player.X ? 'Play!' : 'Waiting for player...' }}</button>
  </div>
</template>
