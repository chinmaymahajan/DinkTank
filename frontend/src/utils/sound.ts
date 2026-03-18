/** Play an NBA-style basketball shot clock buzzer — loud, flat, ~2 seconds */

// Global suppression: when set to a future timestamp, playBuzzer() is a no-op.
let _buzzerSuppressedUntil = 0;

export function suppressBuzzerFor(ms: number) {
  _buzzerSuppressedUntil = Date.now() + ms;
}

// Shared AudioContext — created once, resumed on first user gesture.
let _sharedCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  try {
    const AudioCtx = typeof AudioContext !== 'undefined' ? AudioContext : (typeof (window as any).webkitAudioContext !== 'undefined' ? (window as any).webkitAudioContext : null);
    if (!AudioCtx) return null;
    if (!_sharedCtx || _sharedCtx.state === 'closed') {
      _sharedCtx = new AudioCtx();
    }
    return _sharedCtx;
  } catch {
    return null;
  }
}

/**
 * Warm up the AudioContext by resuming it during a user gesture.
 * Call this from any click/touch handler (e.g. "Start Session") so the
 * context is unlocked before the timer fires automatically.
 */
export function warmUpAudio() {
  const ctx = getAudioContext();
  if (ctx && ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }
}

// Auto-warm on first user interaction so the buzzer works even if
// warmUpAudio() isn't called explicitly.
if (typeof window !== 'undefined') {
  const autoWarm = () => {
    warmUpAudio();
    window.removeEventListener('click', autoWarm);
    window.removeEventListener('touchstart', autoWarm);
    window.removeEventListener('keydown', autoWarm);
  };
  window.addEventListener('click', autoWarm, { once: true });
  window.addEventListener('touchstart', autoWarm, { once: true });
  window.addEventListener('keydown', autoWarm, { once: true });
}

export function playBuzzer() {
  try {
    if (Date.now() < _buzzerSuppressedUntil) return;

    const ctx = getAudioContext();
    if (!ctx) return;

    // Resume just in case (no-op if already running)
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;
    const duration = 2.0;

    // Master output with sharp attack and abrupt cutoff
    const master = ctx.createGain();
    master.gain.setValueAtTime(0, now);
    master.gain.linearRampToValueAtTime(0.8, now + 0.02);
    master.gain.setValueAtTime(0.8, now + duration - 0.05);
    master.gain.linearRampToValueAtTime(0, now + duration);
    master.connect(ctx.destination);

    // Compressor — keeps it loud and flat like a PA horn
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -12;
    comp.ratio.value = 12;
    comp.attack.value = 0.001;
    comp.release.value = 0.05;
    comp.connect(master);

    // Band-pass filter — basketball buzzers sit in a narrow mid-range band
    const bpf = ctx.createBiquadFilter();
    bpf.type = 'bandpass';
    bpf.frequency.value = 370;
    bpf.Q.value = 2.0;
    bpf.connect(comp);

    // Primary tone — sawtooth at ~260 Hz (the core "EHHHHH" frequency)
    const osc1 = ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc1.frequency.value = 260;
    const g1 = ctx.createGain();
    g1.gain.value = 0.55;
    osc1.connect(g1);
    g1.connect(bpf);

    // Second voice — slightly detuned for that thick, beating quality
    const osc2 = ctx.createOscillator();
    osc2.type = 'sawtooth';
    osc2.frequency.value = 263;
    const g2 = ctx.createGain();
    g2.gain.value = 0.55;
    osc2.connect(g2);
    g2.connect(bpf);

    // Square wave one octave down for weight
    const osc3 = ctx.createOscillator();
    osc3.type = 'square';
    osc3.frequency.value = 130;
    const g3 = ctx.createGain();
    g3.gain.value = 0.3;
    osc3.connect(g3);
    g3.connect(bpf);

    // Start and stop all oscillators
    [osc1, osc2, osc3].forEach(o => {
      o.start(now);
      o.stop(now + duration);
    });

    // Disconnect nodes after playback to free resources (don't close the shared ctx)
    setTimeout(() => {
      [osc1, osc2, osc3].forEach(o => o.disconnect());
      [g1, g2, g3, bpf, comp, master].forEach(n => n.disconnect());
    }, (duration + 0.5) * 1000);
  } catch {
    // Silently fail if audio isn't available
  }
}
