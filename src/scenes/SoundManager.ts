export type SFXType = 'kill' | 'synth' | 'breed' | 'boss' | 'overclock' | 'gameover' | 'victory' | 'button';

// BGM: C major, 120 BPM, 8-bar melodic loop (16s)
//   Bass  : C-C-G-G-F-F-G-G (one per bar)
//   Chord : C / G / Am / F  (one per 2 bars)
//   Melody: 32 quarter notes, catchy & bright

const BEAT = 60 / 120;            // 0.5s
const BAR  = BEAT * 4;            // 2s
const LOOP = BAR * 8;             // 16s

const BASS_NOTES  = [65.4, 65.4, 98, 98, 87.3, 87.3, 98, 98]; // C G F G per bar
const CHORD_PADS  = [
  [261.6, 329.6, 392],   // C major
  [196,   246.9, 293.7], // G major
  [220,   261.6, 329.6], // A minor
  [174.6, 220,   261.6], // F major
];
const MELODY = [
  523.3, 659.3, 784,   659.3, // bar1: C E G E
  523.3, 587.3, 659.3, 698.5, // bar2: C D E F
  784,   698.5, 659.3, 587.3, // bar3: G F E D
  523.3, 659.3, 587.3, 523.3, // bar4: C E D C
  698.5, 880,   784,   698.5, // bar5: F A G F
  659.3, 784,   698.5, 659.3, // bar6: E G F E
  587.3, 698.5, 659.3, 587.3, // bar7: D F E D
  523.3, 392,   329.6, 261.6, // bar8: C G E C  ← resolve low
];

const BGM_GAIN = 0.06;

export class SoundManager {
  private ctx: AudioContext | null = null;
  private bgmMaster: GainNode | null = null;
  private bgmLoopTimeout: ReturnType<typeof setTimeout> | null = null;
  private _muted = false;

  get muted(): boolean { return this._muted; }

  toggleMute(): void {
    this._muted = !this._muted;
    if (this.bgmMaster) this.bgmMaster.gain.value = this._muted ? 0 : BGM_GAIN;
  }

  private getCtx(): AudioContext {
    if (!this.ctx) this.ctx = new AudioContext();
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  }

  startBGM(): void {
    const ctx = this.getCtx();
    this.stopBGM();
    const master = ctx.createGain();
    master.gain.value = this._muted ? 0 : BGM_GAIN;
    master.connect(ctx.destination);
    this.bgmMaster = master;
    this.scheduleBGMLoop(ctx, master, ctx.currentTime + 0.05);
  }

  stopBGM(): void {
    if (this.bgmLoopTimeout !== null) {
      clearTimeout(this.bgmLoopTimeout);
      this.bgmLoopTimeout = null;
    }
    try { this.bgmMaster?.disconnect(); } catch {}
    this.bgmMaster = null;
  }

  private scheduleBGMLoop(ctx: AudioContext, master: GainNode, t0: number): void {
    if (this.bgmMaster !== master) return;

    // Bass: one note per bar
    BASS_NOTES.forEach((f, i) => {
      this.note(ctx, master, 'sine', f, 0.30, t0 + i * BAR, BAR * 0.88);
    });

    // Chord pad: one chord per 2 bars
    CHORD_PADS.forEach((chord, ci) => {
      const t = t0 + ci * BAR * 2;
      chord.forEach(f => this.note(ctx, master, 'triangle', f, 0.055, t, BAR * 2 * 0.85));
    });

    // Melody: 32 quarter notes
    MELODY.forEach((f, i) => {
      this.note(ctx, master, 'sine', f, 0.10, t0 + i * BEAT, BEAT * 0.68);
    });

    // Light beat accent on beats 1 & 3 of every bar
    for (let b = 0; b < 8; b++) {
      const t = t0 + b * BAR;
      this.note(ctx, master, 'square', 1760, 0.025, t,          0.03);
      this.note(ctx, master, 'square', 1760, 0.015, t + BEAT * 2, 0.03);
    }

    // Schedule next iteration 150ms before loop end
    const msLeft = (t0 + LOOP - ctx.currentTime) * 1000 - 150;
    this.bgmLoopTimeout = setTimeout(
      () => this.scheduleBGMLoop(ctx, master, t0 + LOOP),
      Math.max(50, msLeft),
    );
  }

  // Small envelope: fast attack, decay to silence
  private note(
    ctx: AudioContext,
    out: AudioNode,
    type: OscillatorType,
    freq: number,
    vol: number,
    start: number,
    dur: number,
  ): void {
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.001, start);
    gain.gain.linearRampToValueAtTime(vol, start + 0.02);
    gain.gain.setValueAtTime(vol, start + dur - 0.06);
    gain.gain.exponentialRampToValueAtTime(0.001, start + dur);
    osc.connect(gain);
    gain.connect(out);
    osc.start(start);
    osc.stop(start + dur + 0.01);
  }

  // ─── SFX ─────────────────────────────────────────────────────────────────

  playSFX(type: SFXType): void {
    if (this._muted) return;
    try {
      const ctx = this.getCtx();
      switch (type) {
        case 'kill':      this.sfxKill(ctx);      break;
        case 'synth':     this.sfxSynth(ctx);     break;
        case 'breed':     this.sfxBreed(ctx);     break;
        case 'boss':      this.sfxBoss(ctx);      break;
        case 'overclock': this.sfxOverclock(ctx); break;
        case 'gameover':  this.sfxGameover(ctx);  break;
        case 'victory':   this.sfxVictory(ctx);   break;
        case 'button':    this.sfxButton(ctx);    break;
      }
    } catch {}
  }

  private tone(ctx: AudioContext, type: OscillatorType, f0: number, f1: number, vol: number, start: number, dur: number): void {
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(f0, start);
    if (f1 !== f0) osc.frequency.exponentialRampToValueAtTime(f1, start + dur);
    gain.gain.setValueAtTime(vol, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + dur);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + dur + 0.01);
  }

  private sfxKill(ctx: AudioContext): void {
    this.tone(ctx, 'triangle', 380, 80, 0.18, ctx.currentTime, 0.1);
  }

  private sfxSynth(ctx: AudioContext): void {
    [261.6, 392, 523.3, 659.3].forEach((f, i) =>
      this.tone(ctx, 'sine', f, f, 0.26, ctx.currentTime + i * 0.07, 0.13));
  }

  private sfxBreed(ctx: AudioContext): void {
    this.tone(ctx, 'sine', 440, 440, 0.20, ctx.currentTime,        0.22);
    this.tone(ctx, 'sine', 660, 660, 0.16, ctx.currentTime + 0.05, 0.20);
  }

  private sfxBoss(ctx: AudioContext): void {
    this.tone(ctx, 'sawtooth', 200, 70, 0.32, ctx.currentTime,       0.55);
    this.tone(ctx, 'sawtooth', 180, 60, 0.18, ctx.currentTime + 0.12, 0.5);
  }

  private sfxOverclock(ctx: AudioContext): void {
    this.tone(ctx, 'sine',   100, 880, 0.40, ctx.currentTime,       0.5);
    this.tone(ctx, 'square',  50, 440, 0.15, ctx.currentTime + 0.1, 0.45);
  }

  private sfxGameover(ctx: AudioContext): void {
    [300, 220, 160, 100].forEach((f, i) =>
      this.tone(ctx, 'triangle', f, f, 0.40, ctx.currentTime + i * 0.22, 0.24));
  }

  private sfxVictory(ctx: AudioContext): void {
    [261.6, 329.6, 392, 523.3].forEach((f, i) =>
      this.tone(ctx, 'sine', f, f, 0.40, ctx.currentTime + i * 0.14, 0.20));
    [523.3, 659.3, 784].forEach(f =>
      this.tone(ctx, 'sine', f, f, 0.28, ctx.currentTime + 0.58, 0.50));
  }

  private sfxButton(ctx: AudioContext): void {
    this.tone(ctx, 'square', 660, 660, 0.06, ctx.currentTime, 0.03);
  }
}
