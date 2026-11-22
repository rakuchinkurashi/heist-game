// One Frame Heist — tiny synthesised sounds, no audio files.
// Everything is a short WebAudio oscillator beep, created on demand so the
// game ships no sound assets at all. Silent until the player first acts,
// which is also when browsers allow audio to start.

let context = null;
let muted = false;

export function isMuted() {
  return muted;
}

export function toggleMute() {
  muted = !muted;
  return muted;
}

function ensureContext() {
  if (context === null) {
    const AudioContext = window.AudioContext ?? window.webkitAudioContext;
    if (!AudioContext) return null;
    context = new AudioContext();
  }
  if (context.state === 'suspended') void context.resume();
  return context;
}

/** Play one short beep: frequency in Hz, seconds long, quiet gain. */
function beep(frequency, seconds, gainValue = 0.06, type = 'sine') {
  if (muted) return;
  const audio = ensureContext();
  if (audio === null) return;
  const oscillator = audio.createOscillator();
  const gain = audio.createGain();
  oscillator.type = type;
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(gainValue, audio.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + seconds);
  oscillator.connect(gain);
  gain.connect(audio.destination);
  oscillator.start();
  oscillator.stop(audio.currentTime + seconds);
}

/** A soft tick when loot is picked up. */
export function playPickup() {
  beep(880, 0.12);
  window.setTimeout(() => beep(1320, 0.14), 70);
}

/** A low warning pulse while the alarm climbs. */
export function playSpotted() {
  beep(220, 0.25, 0.08, 'square');
}

/** A bright chime when the exit door unlocks. */
export function playUnlock() {
  beep(660, 0.12);
  window.setTimeout(() => beep(990, 0.2), 110);
}

/** A coin's clink when it lands. */
export function playCoin() {
  beep(1568, 0.09, 0.05, 'triangle');
}

/** A descending buzz when the thief is caught. */
export function playCaught() {
  beep(330, 0.35, 0.09, 'sawtooth');
  window.setTimeout(() => beep(165, 0.5, 0.09, 'sawtooth'), 160);
}

/** A rising fanfare for the getaway. */
export function playEscape() {
  beep(523, 0.15);
  window.setTimeout(() => beep(659, 0.15), 130);
  window.setTimeout(() => beep(784, 0.3), 260);
}
