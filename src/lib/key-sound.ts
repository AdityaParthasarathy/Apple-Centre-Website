// A key-click for the on-page Magic Keyboard, made in the browser with the Web
// Audio API rather than played from a sound file: nothing to download, no
// licensing, and every press can differ a little so it doesn't sound like one
// sample on repeat.
//
// Each press is a light, crisp "tick" — a very short burst of filtered noise,
// like a thin scissor-switch key bottoming out — with a faint, high little
// tap under it for body. Nothing low or boomy. Releasing a key is just a
// quieter, higher tick. Bigger keys (space, return...) get a slightly fuller
// tap, still light.

type WebkitWindow = Window & { webkitAudioContext?: typeof AudioContext }

let context: AudioContext | null = null
let noise: AudioBuffer | null = null

const HEAVY_KEYS = new Set(['Space', 'Enter', 'Backspace', 'Tab', 'CapsLock', 'ShiftLeft', 'ShiftRight'])
const MASTER_VOLUME = 0.5

// Browsers only allow sound after the person has interacted with the page. A
// key press or a click on the keyboard is exactly that, so the context is
// created — and woken if the browser put it to sleep — at the moment of the
// first one.
function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!context) {
    const Ctor = window.AudioContext ?? (window as WebkitWindow).webkitAudioContext
    if (!Ctor) return null
    try {
      context = new Ctor()
    } catch {
      return null
    }
  }
  if (context.state === 'suspended') void context.resume().catch(() => {})
  return context
}

function getNoise(ctx: AudioContext): AudioBuffer {
  if (!noise) {
    noise = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.06), ctx.sampleRate)
    const data = noise.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  }
  return noise
}

/** Play the sound of a key going down ('down') or coming back up ('up'). */
export function playKeySound(phase: 'down' | 'up', keyCode = ''): void {
  const ctx = getContext()
  if (!ctx) return

  try {
    const now = ctx.currentTime
    const heavy = HEAVY_KEYS.has(keyCode)
    const down = phase === 'down'
    // Every press a touch different: pitch and loudness wander by a few percent.
    const wobble = 0.92 + Math.random() * 0.16
    const level = MASTER_VOLUME * (down ? 1 : 0.35) * (0.9 + Math.random() * 0.2)

    // The tick.
    const tick = ctx.createBufferSource()
    tick.buffer = getNoise(ctx)
    const filter = ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.value = (down ? 4600 : 5600) * wobble
    filter.Q.value = 1.1
    const tickGain = ctx.createGain()
    const tickLength = down ? 0.016 : 0.009
    tickGain.gain.setValueAtTime(0.0001, now)
    tickGain.gain.exponentialRampToValueAtTime((down ? 0.55 : 0.4) * level, now + 0.0007)
    tickGain.gain.exponentialRampToValueAtTime(0.0001, now + tickLength)
    tick.connect(filter).connect(tickGain).connect(ctx.destination)
    tick.start(now)
    tick.stop(now + tickLength + 0.01)

    // A faint, high tap under the tick (only when the key goes down).
    if (down) {
      const tap = ctx.createOscillator()
      tap.type = 'sine'
      const from = (heavy ? 720 : 1050) * wobble
      tap.frequency.setValueAtTime(from, now)
      tap.frequency.exponentialRampToValueAtTime(from * 0.6, now + 0.03)
      const tapGain = ctx.createGain()
      const tapLength = heavy ? 0.04 : 0.026
      tapGain.gain.setValueAtTime(0.0001, now)
      tapGain.gain.exponentialRampToValueAtTime((heavy ? 0.13 : 0.09) * level, now + 0.002)
      tapGain.gain.exponentialRampToValueAtTime(0.0001, now + tapLength)
      tap.connect(tapGain).connect(ctx.destination)
      tap.start(now)
      tap.stop(now + tapLength + 0.01)
    }
  } catch {
    // A sound that can't play is never worth an error on the page.
  }
}
