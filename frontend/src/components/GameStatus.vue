<script setup lang="ts">
import { computed } from 'vue';
import { Game } from '../models/Game';
import { Player } from '../enums/Player';
import { t } from '../i18n';
import type { Reaction } from '../reactions';
import Mark from './Mark.vue';
import ReactionMenu from './ReactionMenu.vue';

type ShownReaction = { emoji: Reaction; id: number };

const props = defineProps<{
  game: Game;
  score: { you: number; them: number; draws: number };
  /** Who has pressed "Play again" so far. */
  rematch: 'none' | 'you' | 'them';
  youStartNext: boolean;
  yourReaction: ShownReaction | null;
  theirReaction: ShownReaction | null;
}>();

const emit = defineEmits<{
  (e: 'play-again'): void;
  (e: 'react', emoji: Reaction): void;
}>();

const gamesPlayed = computed(() => props.score.you + props.score.them + props.score.draws);

const you = computed(() => props.game.currentPlayer);
const them = computed(() => (you.value === Player.X ? Player.O : Player.X));
const yourTurn = computed(() => props.game.activePlayer === you.value);

const players = computed(() => [
  {
    player: you.value,
    name: t.value.status.you,
    boards: props.game.getWonBoards(you.value).length,
    reaction: props.yourReaction,
  },
  {
    player: them.value,
    name: t.value.status.other,
    boards: props.game.getWonBoards(them.value).length,
    reaction: props.theirReaction,
  },
]);

const rematchNote = computed(() => {
  const s = t.value.status;
  if (props.rematch === 'them') return s.otherWantsRematch;
  const next = props.youStartNext ? s.nextYouFirst : s.nextOtherFirst;
  return props.rematch === 'you' ? next : `${s.playAgainNote} ${next}`;
});

const headline = computed(() => {
  const s = t.value.status;
  const { winner, draw } = props.game;
  if (winner) return winner === you.value ? s.youWon : s.otherWon;
  if (draw) return s.draw;
  return yourTurn.value ? s.yourMove : s.theirMove;
});

const detail = computed(() => {
  const s = t.value.status;
  const { winner, draw, availableBoards } = props.game;
  if (winner) return winner === you.value ? s.youWonDetail : s.otherWonDetail;
  if (draw) return s.drawDetail;

  const only = availableBoards.length === 1 ? availableBoards[0].index : null;
  if (yourTurn.value) return only === null ? s.playAnywhere : s.playIn(only);
  return only === null ? s.waitingAnywhere(them.value) : s.waitingIn(them.value, only);
});
</script>

<template>
  <section class="status" aria-labelledby="status-title">
    <div class="status__turn" :class="{ 'status__turn--you': yourTurn && !game.over }">
      <div class="status__head">
        <h2 id="status-title" class="status__headline">{{ headline }}</h2>
      </div>
      <ReactionMenu class="status__react" @react="(emoji: Reaction) => emit('react', emoji)" />
      <p class="status__detail">{{ detail }}</p>
    </div>

    <template v-if="game.over">
      <button
        type="button"
        class="btn btn--primary btn--block status__again"
        :class="{ 'status__again--invited': rematch === 'them' }"
        :disabled="rematch === 'you'"
        @click="emit('play-again')"
      >
        {{ rematch === 'you' ? t.status.waitingForRematch : t.status.playAgain }}
      </button>
      <p class="status__note" role="status">{{ rematchNote }}</p>
    </template>

    <ul class="status__players" :aria-label="t.status.players">
      <li
        v-for="p in players"
        :key="p.player"
        class="status__player"
        :class="{ 'status__player--active': !game.over && game.activePlayer === p.player }"
      >
        <span class="status__mark"><Mark :player="p.player" /></span>
        <span class="status__who">
          <span class="status__name">{{ p.name }}</span>
          <span class="status__boards">{{ t.status.boardsWon(p.boards) }}</span>
        </span>
        <span v-if="!game.over && game.activePlayer === p.player" class="sr-only">, {{ t.status.toMove }}</span>
        <span
          v-if="p.reaction"
          :key="p.reaction.id"
          class="status__reaction"
          :class="{ 'status__reaction--them': p.player !== you }"
          aria-hidden="true"
        >{{ p.reaction.emoji }}</span>
      </li>
    </ul>

    <p v-if="gamesPlayed > 0" class="status__score">
      <span class="sr-only">{{ t.status.scoreSpoken(score.you, score.them, score.draws) }}</span>
      <span aria-hidden="true">
        {{ t.status.score }}
        <strong class="status__tally">{{ score.you }}&thinsp;–&thinsp;{{ score.them }}</strong>
        <span v-if="score.draws">· {{ t.status.draws(score.draws) }}</span>
      </span>
    </p>

    <p class="status__moves">{{ t.status.moveCount(game.moveCount) }}</p>
  </section>
</template>

<style scoped>
.status {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

/* Headline with the React button on its right; the detail line runs underneath both */
.status__turn {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  column-gap: 0.5rem;
  align-items: start;
}

/* Tucked into the panel's padding so short headlines like "Even wachten" stay on one line */
.status__react {
  grid-column: 2;
  grid-row: 1;
  margin: -0.125rem -0.875rem 0 0;
}

@media (max-width: 959px) {
  .status__react {
    margin: -0.25rem -0.5rem 0 0;
  }
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
  grid-column: 1 / -1;
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

/* The other player already asked for a rematch: make the button beg a little */
.status__again--invited {
  animation: invite 1.4s ease-in-out infinite;
}

@keyframes invite {
  50% {
    box-shadow: 0 0 0 6px var(--highlight-soft);
  }
}

/* Session score, laid out you – them to match the chips above */
.status__score {
  margin: -0.25rem 0 0;
  color: var(--ink-soft);
}

.status__tally {
  margin: 0 0.25rem;
  color: var(--ink);
  font-size: var(--step-1);
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}

/* Reaction bubble that floats up from the player's chip and fades away */
.status__reaction {
  position: absolute;
  top: -0.25rem;
  right: 0.5rem;
  font-size: 1.75rem;
  line-height: 1;
  pointer-events: none;
  opacity: 0;
  animation: reaction-float 2.4s cubic-bezier(0.2, 0.7, 0.3, 1) forwards;
}

.status__reaction--them {
  font-size: 2.5rem;
}

@keyframes reaction-float {
  0% {
    opacity: 0;
    transform: translateY(0.5rem) scale(0.4);
  }
  12% {
    opacity: 1;
    transform: translateY(-1rem) scale(1.15);
  }
  22% {
    transform: translateY(-1.25rem) scale(1);
  }
  75% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: translateY(-2.25rem) scale(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  /* The global reset would make the bubble vanish instantly; just show it, then fade */
  .status__reaction {
    animation: reaction-fade 2.4s linear forwards !important;
    animation-duration: 2.4s !important;
    top: -1rem;
  }
}

@keyframes reaction-fade {
  0%,
  80% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
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
  position: relative;
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
  overflow-wrap: break-word;
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
