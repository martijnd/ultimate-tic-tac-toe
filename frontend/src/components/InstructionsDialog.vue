<script setup lang="ts">
defineProps({
  show: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close']);
</script>

<template>
  <!-- Dialog overlay -->
  <div
    v-show="show"
    class="absolute top-0 left-0 w-full h-full bg-zinc-800/70"
    @click="emit('close')"
  ></div>
  <!-- Dialog -->
  <div
    class="fixed top-1/2 left-1/2 transform flex flex-col space-y-6 -translate-x-1/2 -translate-y-1/2 bg-zinc-800 text-white p-8 rounded-lg min-w-[250px] max-w-[600px] max-h-[400px] overflow-y-auto"
    v-show="show"
  >
    <h2
      class="text-center text-xl font-bold"
    >How to play Ultimate Tic Tac Toe?</h2>
    <p
      class=""
    >Players take turns playing in the smaller tic-tac-toe boards until one of them wins in the larger tic-tac-toe board.</p>
    <p
      class=""
    >Each small 3 x 3 tic-tac-toe board is referred to as a local board, and the larger 3 x 3 board is referred to as the global board.</p>
    <p
      class=""
    >The game starts with X playing wherever they want in any of the 81 empty spots. This move "sends" their opponent to its relative location. For example, if X played in the top right square of their local board, then O needs to play next in the local board at the top right of the global board. O can then play in any one of the nine available spots in that local board, each move sending X to a different local board.</p>
    <figure class="my-4">
      <img
        class="max-h-[300px] mx-auto"
        src="/images/forced_move.png"
        alt="Forced move example"
      />
      <figcaption class="italic my-2">Since X played in the top-right corner of the local board, O is forced to play their next move in the top-right local board.</figcaption>
    </figure>

    <p
      class=""
    >If a move is played so that it is to win a local board by the rules of normal tic-tac-toe, then the entire local board is marked as a victory for the player in the global board.</p>
    <p
      class=""
    >Once a local board is won by a player or it is filled completely, no more moves may be played in that board. If a player is sent to such a board, then that player may play in any other board.</p>
    <p
      class=""
    >Game play ends when either a player wins the global board or there are no legal moves remaining, in which case the game is a draw.</p>
  </div>
</template>
