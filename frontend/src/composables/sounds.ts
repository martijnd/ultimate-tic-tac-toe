// Tiny synthesized sounds (Web Audio), so there are no audio files to ship.
// Browsers only allow audio after a user gesture; if it's still blocked we silently skip.
let ctx: AudioContext | null = null;

function tone(freq: number, start: number, duration: number, volume = 0.15, type: OscillatorType = 'sine') {
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const t0 = ctx.currentTime + start;
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(volume, t0 + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.05);
}

function play(fn: () => void) {
  try {
    ctx ??= new AudioContext();
    if (ctx.state === 'suspended') void ctx.resume();
    fn();
  } catch {
    // audio unavailable: ignore
  }
}

/** "Ping!" when the other player joins. */
export function playJoinSound() {
  play(() => {
    tone(880, 0, 0.5, 0.18);
    tone(1760, 0, 0.35, 0.05);
  });
}

/** Soft wooden tick when the other player makes a move. */
export function playMoveSound() {
  play(() => {
    tone(330, 0, 0.12, 0.2, 'triangle');
    tone(495, 0.07, 0.15, 0.12, 'triangle');
  });
}
