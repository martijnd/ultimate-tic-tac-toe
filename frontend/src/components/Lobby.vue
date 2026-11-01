<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { Game } from '../models/Game';
import { Player } from '../enums/Player';
import Mark from './Mark.vue';
import { t } from '../i18n';

const props = defineProps<{
  game: Game;
  connected: boolean;
}>();

const emit = defineEmits<{
  (e: 'play'): void;
}>();

const currentUrl = ref('');
const copied = ref(false);
const copyFailed = ref(false);
const linkInput = ref<HTMLInputElement | null>(null);
const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';
let copiedTimer: number | undefined;

onMounted(() => {
  currentUrl.value = document.location.href;
});

onBeforeUnmount(() => window.clearTimeout(copiedTimer));

const isHost = computed(() => props.game.currentPlayer === Player.X);
const canStart = computed(() => props.connected || !isHost.value);

async function onClickCopy() {
  copyFailed.value = false;
  try {
    await navigator.clipboard.writeText(currentUrl.value);
  } catch {
    // Clipboard API is unavailable on insecure origins (like a LAN dev server). Fall back to selecting the text.
    linkInput.value?.select();
    const ok = document.execCommand?.('copy');
    if (!ok) {
      copyFailed.value = true;
      return;
    }
  }
  copied.value = true;
  window.clearTimeout(copiedTimer);
  copiedTimer = window.setTimeout(() => {
    copied.value = false;
  }, 2500);
}

async function onClickShare() {
  try {
    await navigator.share({
      title: t.value.lobby.shareTitle,
      text: t.value.lobby.shareText,
      url: currentUrl.value,
    });
  } catch {
    // Share sheet dismissed; nothing to do.
  }
}
</script>

<template>
  <section class="lobby" aria-labelledby="lobby-title">
    <div class="lobby__you">
      <span class="lobby__mark">
        <Mark :player="game.currentPlayer" animate />
      </span>
      <div>
        <h2 id="lobby-title" class="lobby__title">{{ t.lobby.youArePlaying(game.currentPlayer) }}</h2>
        <p class="lobby__sub">
          {{ isHost ? t.lobby.hostIntro : t.lobby.guestIntro }}
        </p>
      </div>
    </div>

    <div v-if="isHost" class="lobby__invite">
      <label for="invite-link" class="lobby__label">{{ t.lobby.sendLink }}</label>
      <div class="lobby__link-row">
        <input
          id="invite-link"
          ref="linkInput"
          class="lobby__link"
          type="text"
          readonly
          :value="currentUrl"
          @focus="linkInput?.select()"
        />
        <button type="button" class="btn btn--secondary lobby__copy" @click="onClickCopy">
          {{ copied ? t.lobby.copied : t.lobby.copyLink }}
        </button>
      </div>
      <button v-if="canShare" type="button" class="btn btn--quiet btn--block" @click="onClickShare">
        {{ t.lobby.shareLink }}
      </button>
      <p class="lobby__feedback" role="status">
        <template v-if="copied">{{ t.lobby.copiedFeedback }}</template>
        <template v-else-if="copyFailed">{{ t.lobby.copyFailed }}</template>
      </p>
    </div>

    <p v-if="isHost" class="lobby__presence" :class="{ 'lobby__presence--here': connected }" role="status">
      <span class="lobby__dot" aria-hidden="true"></span>
      {{ connected ? t.lobby.friendJoined : t.lobby.waitingForOpen }}
    </p>

    <button
      type="button"
      class="btn btn--primary btn--block lobby__start"
      :disabled="!canStart"
      @click="emit('play')"
    >
      {{ canStart ? t.lobby.startGame : t.lobby.waitingForFriend }}
    </button>
  </section>
</template>

<style scoped>
.lobby {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.lobby__you {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.lobby__mark {
  flex: none;
  width: 48px;
  height: 48px;
}

.lobby__title {
  margin: 0;
  font-size: var(--step-2);
  font-weight: 800;
  line-height: 1.1;
  letter-spacing: -0.02em;
}

.lobby__sub {
  margin: 0.375rem 0 0;
  color: var(--ink-soft);
}

.lobby__invite {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

.lobby__label {
  font-weight: 600;
}

.lobby__link-row {
  display: flex;
  gap: 0.5rem;
}

.lobby__link {
  flex: 1;
  min-width: 0;
  min-height: 48px;
  padding: 0 0.875rem;
  border: 1.5px solid var(--rule);
  border-radius: var(--radius-control);
  background: var(--paper);
  color: var(--ink);
  font: inherit;
  font-size: var(--step--1);
  text-overflow: ellipsis;
}

.lobby__link:focus-visible {
  outline-offset: 1px;
}

.lobby__copy {
  flex: none;
  min-width: 7.5rem;
}

.lobby__feedback {
  margin: 0;
  min-height: 1.5em;
  font-size: var(--step--1);
  color: var(--ink-soft);
}

.lobby__feedback:empty {
  min-height: 0;
  margin-top: -0.625rem;
}

.lobby__presence {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  margin: 0;
  color: var(--ink-soft);
}

.lobby__presence--here {
  color: var(--ink);
  font-weight: 600;
}

.lobby__dot {
  position: relative;
  flex: none;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--ink-soft);
}

.lobby__dot::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 2px solid var(--ink-soft);
  animation: ping 1.6s ease-out infinite;
}

.lobby__presence--here .lobby__dot {
  background: var(--x);
}

.lobby__presence--here .lobby__dot::after {
  display: none;
}

@keyframes ping {
  from {
    transform: scale(1);
    opacity: 0.8;
  }
  to {
    transform: scale(2.6);
    opacity: 0;
  }
}

.lobby__start {
  min-height: 56px;
  font-size: var(--step-1);
}
</style>
