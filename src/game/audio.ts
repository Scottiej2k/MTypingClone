/**
 * All sound is synthesised with the Web Audio API, so there are no audio files to ship.
 * The AudioContext is created lazily on the first user gesture (browser autoplay rules).
 */

type Wave = OscillatorType;

const PENTATONIC = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24, 26, 28];
const MINOR_PENTATONIC = [0, 3, 5, 7, 10, 12, 15, 17, 19, 22, 24, 27, 29];
const midiToHz = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

interface Song {
  root: number; // MIDI note of the key centre
  bpm: number;
  chords: number[][]; // semitone offsets from root, one chord per bar
  seed: number;
  lead: Wave;
  scale?: number[];
}

const SONGS: Record<string, Song> = {
  title: { root: 60, bpm: 104, chords: [[0, 4, 7], [-3, 0, 4], [5, 9, 12], [7, 11, 14]], seed: 7, lead: 'triangle' },
  world1: { root: 62, bpm: 116, chords: [[0, 4, 7], [7, 11, 14], [9, 12, 16], [5, 9, 12]], seed: 11, lead: 'square' },
  world2: { root: 65, bpm: 100, chords: [[0, 4, 7], [5, 9, 12], [2, 5, 9], [7, 11, 14]], seed: 23, lead: 'triangle' },
  world3: { root: 60, bpm: 124, chords: [[0, 4, 7], [9, 12, 16], [5, 9, 12], [7, 11, 14]], seed: 41, lead: 'square' },
  world4: { root: 57, bpm: 96, chords: [[0, 3, 7], [8, 12, 15], [3, 7, 10], [10, 14, 17]], seed: 5, lead: 'sine', scale: MINOR_PENTATONIC },
};

function rngFrom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/** Deterministic 4-bar melody of 8th notes built from chord tones and pentatonic steps. */
function composeMelody(song: Song): (number | null)[] {
  const rand = rngFrom(song.seed);
  const scale = song.scale ?? PENTATONIC;
  const notes: (number | null)[] = [];
  let prev = 12;
  for (const chord of song.chords) {
    for (let step = 0; step < 8; step++) {
      if (step > 0 && rand() < 0.28) {
        notes.push(null);
        continue;
      }
      if (step % 2 === 0) {
        // Strong beats land on chord tones, near the previous note.
        const options = chord.flatMap((c) => [c, c + 12]);
        options.sort((a, b) => Math.abs(a - prev) - Math.abs(b - prev));
        prev = options[Math.floor(rand() * 2)];
      } else {
        const found = scale.findIndex((p) => p >= prev);
        const i = found < 0 ? scale.length - 1 : found;
        const dir = rand() < 0.5 ? -1 : 1;
        prev = scale[Math.min(scale.length - 1, Math.max(0, i + dir))];
      }
      notes.push(prev);
    }
  }
  return notes;
}

class AudioEngine {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private sfxBus!: GainNode;
  private musicBus!: GainNode;
  private sfxOn = true;
  private musicOn = true;
  private song: Song | null = null;
  private songKey = '';
  private melody: (number | null)[] = [];
  private step = 0;
  private nextTime = 0;
  private timer: number | null = null;

  /** Must be called from a user gesture before any sound plays. */
  unlock(): void {
    if (!this.ctx) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return;
      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.8;
      this.master.connect(this.ctx.destination);
      this.sfxBus = this.ctx.createGain();
      this.sfxBus.gain.value = this.sfxOn ? 0.5 : 0;
      this.sfxBus.connect(this.master);
      this.musicBus = this.ctx.createGain();
      this.musicBus.gain.value = this.musicOn ? 0.16 : 0;
      this.musicBus.connect(this.master);
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    if (this.songKey && this.timer === null) this.startLoop();
  }

  setSfx(on: boolean): void {
    this.sfxOn = on;
    if (this.ctx) this.sfxBus.gain.setTargetAtTime(on ? 0.5 : 0, this.ctx.currentTime, 0.02);
  }

  setMusic(on: boolean): void {
    this.musicOn = on;
    if (this.ctx) this.musicBus.gain.setTargetAtTime(on ? 0.16 : 0, this.ctx.currentTime, 0.1);
  }

  private tone(freq: number, start: number, dur: number, wave: Wave, gain: number, bus: GainNode, slideTo?: number): void {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = wave;
    osc.frequency.setValueAtTime(freq, start);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, start + dur);
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(gain, start + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    osc.connect(g).connect(bus);
    osc.start(start);
    osc.stop(start + dur + 0.02);
  }

  private get now(): number {
    return this.ctx ? this.ctx.currentTime : 0;
  }

  /** Happy blip that climbs the scale as the streak grows. */
  correct(streak: number): void {
    if (!this.ctx) return;
    const note = 72 + PENTATONIC[streak % 8];
    this.tone(midiToHz(note), this.now, 0.14, 'square', 0.18, this.sfxBus);
    this.tone(midiToHz(note + 12), this.now + 0.03, 0.12, 'sine', 0.12, this.sfxBus);
    this.tone(220, this.now, 0.18, 'sine', 0.12, this.sfxBus, 520);
  }

  /** Gentle "bonk" — clearly different from success but never scary. */
  wrong(): void {
    if (!this.ctx) return;
    this.tone(260, this.now, 0.16, 'triangle', 0.35, this.sfxBus, 170);
    this.tone(200, this.now + 0.1, 0.2, 'triangle', 0.3, this.sfxBus, 130);
  }

  click(): void {
    if (!this.ctx) return;
    this.tone(880, this.now, 0.05, 'sine', 0.15, this.sfxBus, 1200);
  }

  unlockChime(): void {
    if (!this.ctx) return;
    [84, 88, 91, 96, 100].forEach((n, i) => this.tone(midiToHz(n), this.now + i * 0.07, 0.35, 'sine', 0.15, this.sfxBus));
  }

  fanfare(): void {
    if (!this.ctx) return;
    const seq = [72, 76, 79, 84, 79, 84, 88];
    const durs = [0.12, 0.12, 0.12, 0.28, 0.12, 0.12, 0.6];
    let t = this.now + 0.05;
    seq.forEach((n, i) => {
      this.tone(midiToHz(n), t, durs[i] + 0.1, 'square', 0.14, this.sfxBus);
      this.tone(midiToHz(n - 12), t, durs[i] + 0.1, 'triangle', 0.18, this.sfxBus);
      t += durs[i];
    });
  }

  countdown(final: boolean): void {
    if (!this.ctx) return;
    this.tone(midiToHz(final ? 84 : 72), this.now, final ? 0.35 : 0.15, 'square', 0.14, this.sfxBus);
  }

  /** Switch background music. Passing null stops it. */
  play(key: string | null): void {
    if (key === this.songKey) return;
    this.stopLoop();
    this.songKey = key ?? '';
    this.song = key ? SONGS[key] ?? null : null;
    if (!this.song) return;
    this.melody = composeMelody(this.song);
    if (this.ctx) this.startLoop();
  }

  private startLoop(): void {
    if (!this.ctx || !this.song) return;
    this.step = 0;
    this.nextTime = this.ctx.currentTime + 0.1;
    this.timer = window.setInterval(() => this.schedule(), 50);
  }

  private stopLoop(): void {
    if (this.timer !== null) window.clearInterval(this.timer);
    this.timer = null;
  }

  private schedule(): void {
    if (!this.ctx || !this.song) return;
    const song = this.song;
    const eighth = 60 / song.bpm / 2;
    while (this.nextTime < this.ctx.currentTime + 0.2) {
      const bar = Math.floor(this.step / 8) % song.chords.length;
      const inBar = this.step % 8;
      const chord = song.chords[bar];
      const t = this.nextTime;
      const mel = this.melody[this.step % this.melody.length];
      if (mel !== null) this.tone(midiToHz(song.root + 12 + mel), t, eighth * 0.9, song.lead, 0.12, this.musicBus);
      // Bouncy bass: root on beats, fifth on off-beats.
      if (inBar % 2 === 0) {
        const bassNote = song.root - 24 + chord[0] + (inBar % 4 === 2 ? 7 : 0);
        this.tone(midiToHz(bassNote), t, eighth * 1.6, 'triangle', 0.4, this.musicBus);
      }
      // Soft chord pad at the start of each bar.
      if (inBar === 0) {
        for (const c of chord) this.tone(midiToHz(song.root + c), t, eighth * 7.5, 'sine', 0.06, this.musicBus);
      }
      // Tiny shaker on every 8th.
      this.noise(t, inBar % 2 === 0 ? 0.03 : 0.015);
      this.nextTime += eighth;
      this.step++;
    }
  }

  private noiseBuffer: AudioBuffer | null = null;

  private noise(start: number, gain: number): void {
    if (!this.ctx) return;
    if (!this.noiseBuffer) {
      const len = Math.floor(this.ctx.sampleRate * 0.05);
      this.noiseBuffer = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const data = this.noiseBuffer.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    }
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const hp = this.ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 6000;
    const g = this.ctx.createGain();
    g.gain.value = gain;
    src.connect(hp).connect(g).connect(this.musicBus);
    src.start(start);
  }
}

export const audio = new AudioEngine();
