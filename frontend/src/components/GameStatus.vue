<script setup lang="ts">
import { computed } from 'vue';
import { Game } from '../models/Game';
import { Player } from '../enums/Player';
import { boardName } from '../positions';
import Mark from './Mark.vue';

const props = defineProps<{
  game: Game;
}>();

const emit = defineEmits<{
  (e: 'play-again'): void;
}>();

const you = computed(() => props.game.currentPlayer);
const them = computed(() => (you.value === Player.X ? Player.O : Player.X));
const yourTurn = computed(() => props.game.activePlayer === you.value);

const players = computed(() => [
  { player: you.value, name: 'You', boards: props.game.getWonBoards(you.value).length },
  { player: them.value, name: 'Friend', boards: props.game.getWonBoards(them.value).length },
]);

const headline = computed(() => {
  const { winner, draw } = props.game;
  if (winner) return winner === you.value ? 'You won!' : 'Your friend won';
  if (draw) return "It's a draw";
  return yourTurn.value ? 'Your move' : 'Their move';
});

const detail = computed(() => {
  const { winner, draw, availableBoards } = props.game;
  if (winner) return winner === you.value ? 'Three boards in a row. Nicely played.' : 'They got three boards in a row.';
  if (draw) return 'No moves left and no three boards in a row.';

  const where =
    availableBoards.length === 1
      ? `in the ${boardName(availableBoards[0].index)}`
      : 'in any highlighted board';
  return yourTurn.value ? `Play ${where}.` : `Waiting for ${them.value} to play ${where}.`;
});
</script>

<template>
  <section class="status" aria-labelledby="status-title">
    <div class="status__turn" :class="{ 'status__turn--you': yourTurn && !game.over }">
      <h2 id="status-title" class="status__headline">{{ headline }}</h2>
      <p class="status__detail">{{ detail }}</p>
    </div>

    <button v-if="game.over" type="button" class="btn btn--primary btn--block status__again" @click="emit('play-again')">
      Play again
    </button>
    <p v-if="game.over" class="status__note">Your friend needs to press Play again too.</p>

    <ul class="status__players" aria-label="Players">
      <li
        v-for="p in players"
        :key="p.player"
        class="status__player"
        :class="{ 'status__player--active': !game.over && game.activePlayer === p.player }"
      >
        <span class="status__mark"><Mark :player="p.player" /></span>
        <span class="status__who">
          <span class="status__name">{{ p.name }}</span>
          <span class="status__boards">{{ p.boards }} {{ p.boards === 1 ? 'board' : 'boards' }}</span>
        </span>
        <span v-if="!game.over && game.activePlayer === p.player" class="sr-only">, to move</span>
      </li>
    </ul>

    <p class="status__moves">Move {{ game.moveCount }}</p>
  </section>
</template>

<style scoped>
.status {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.status__turn {
  position: relative;
}

.status__headline {
  display: inline;
  margin: 0;
  font-size: var(--step-4);
  font-weight: 800;
  line-height: 1.05;
  letter-spacing: -0.03em;
  /* Highlighter stroke behind the words when it's your move */
  background-image: linear-gradient(transparent 0, transparent 0);
  background-repeat: no-repeat;
  background-position: 0 88%;
  background-size: 0% 0.5em;
  transition: background-size 260ms cubic-bezier(0.3, 0, 0.2, 1);
  -webkit-box-decoration-break: clone;
  box-decoration-break: clone;
  padding: 0 0.1em;
  margin-left: -0.1em;
}

.status__turn--you .status__headline {
  background-image: linear-gradient(var(--highlight), var(--highlight));
  background-size: 100% 0.5em;
}

@media (prefers-color-scheme: dark) {
  .status__turn--you .status__headline {
    background-image: linear-gradient(var(--highlight), var(--highlight));
    background-position: 0 100%;
    background-size: 100% 0.14em;
  }
}

.status__detail {
  margin: 0.5rem 0 0;
  font-size: var(--step-1);
  line-height: 1.35;
  color: var(--ink-soft);
}

.status__again {
  min-height: 56px;
  font-size: var(--step-1);
}

.status__note {
  margin: -0.5rem 0 0;
  font-size: var(--step--1);
  color: var(--ink-soft);
}

.status__players {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.status__player {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.625rem 0.75rem;
  border: 1.5px solid var(--rule);
  border-radius: var(--radius-control);
  min-width: 0;
}

.status__player--active {
  border-color: var(--ink);
  box-shadow: inset 0 0 0 1px var(--ink);
}

.status__mark {
  flex: none;
  width: 28px;
  height: 28px;
  --mark-stroke: 12;
}

.status__who {
  display: flex;
  flex-direction: column;
  min-width: 0;
  line-height: 1.25;
}

.status__name {
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.status__boards {
  font-size: var(--step--1);
  color: var(--ink-soft);
}

.status__moves {
  margin: 0;
  font-size: var(--step--1);
  color: var(--ink-soft);
  font-variant-numeric: tabular-nums;
}

@media (max-width: 959px) {
  .status {
    gap: 0.875rem;
  }

  .status__headline {
    font-size: var(--step-3);
  }

  .status__detail {
    font-size: var(--step-0);
    margin-top: 0.25rem;
  }

  .status__moves {
    display: none;
  }
}
</style>
