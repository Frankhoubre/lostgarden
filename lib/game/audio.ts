/**
 * Synthesised chiptune audio: no asset files, everything is generated with
 * WebAudio oscillators. Music is a small step sequencer with a square lead,
 * a triangle bass and a noise hat, one pattern per level.
 */

type Note = number | 0; // MIDI note number, 0 = rest

export type Song = {
  bpm: number;
  lead: Note[];
  bass: Note[];
  hat: (0 | 1)[];
};

const midi = (n: number) => 440 * Math.pow(2, (n - 69) / 12);

// Forêt bleue: melancholic minor arpeggio, slow.
const SONG_FOREST: Song = {
  bpm: 112,
  lead: [
    57, 0, 60, 0, 64, 0, 60, 0, 57, 0, 60, 0, 67, 0, 64, 0,
    55, 0, 59, 0, 62, 0, 59, 0, 55, 0, 59, 0, 65, 0, 62, 0,
    53, 0, 57, 0, 60, 0, 57, 0, 53, 0, 57, 0, 64, 0, 60, 0,
    52, 0, 55, 0, 59, 0, 55, 0, 52, 0, 55, 0, 62, 0, 59, 64,
  ],
  bass: [
    33, 0, 0, 0, 33, 0, 45, 0, 33, 0, 0, 0, 33, 0, 45, 0,
    31, 0, 0, 0, 31, 0, 43, 0, 31, 0, 0, 0, 31, 0, 43, 0,
    29, 0, 0, 0, 29, 0, 41, 0, 29, 0, 0, 0, 29, 0, 41, 0,
    28, 0, 0, 0, 28, 0, 40, 0, 28, 0, 0, 0, 28, 0, 40, 0,
  ],
  hat: [
    1, 0, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1, 0,
    1, 0, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1, 0,
    1, 0, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1, 0,
    1, 0, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1, 1,
  ],
};

// Monde des chaînes: heavier, driving.
const SONG_CHAINS: Song = {
  bpm: 132,
  lead: [
    50, 0, 50, 53, 0, 57, 0, 55, 53, 0, 50, 0, 48, 0, 50, 0,
    50, 0, 50, 53, 0, 57, 0, 60, 58, 0, 57, 0, 53, 0, 50, 0,
    46, 0, 46, 50, 0, 53, 0, 50, 48, 0, 46, 0, 45, 0, 46, 0,
    45, 0, 45, 48, 0, 52, 0, 55, 53, 0, 52, 0, 48, 0, 45, 0,
  ],
  bass: [
    26, 26, 0, 26, 0, 26, 26, 0, 26, 26, 0, 26, 0, 26, 26, 0,
    26, 26, 0, 26, 0, 26, 26, 0, 26, 26, 0, 26, 0, 26, 26, 0,
    22, 22, 0, 22, 0, 22, 22, 0, 22, 22, 0, 22, 0, 22, 22, 0,
    21, 21, 0, 21, 0, 21, 21, 0, 21, 21, 0, 21, 0, 21, 21, 0,
  ],
  hat: [
    1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1,
    1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1,
    1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1,
    1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1,
  ],
};

// Château: organ-like, solemn.
const SONG_CASTLE: Song = {
  bpm: 120,
  lead: [
    64, 0, 0, 63, 0, 0, 64, 0, 60, 0, 0, 0, 57, 0, 0, 0,
    62, 0, 0, 60, 0, 0, 62, 0, 59, 0, 0, 0, 55, 0, 0, 0,
    60, 0, 0, 59, 0, 0, 60, 0, 57, 0, 0, 0, 53, 0, 0, 0,
    59, 0, 0, 60, 0, 0, 62, 0, 64, 0, 0, 0, 0, 0, 0, 0,
  ],
  bass: [
    33, 0, 0, 33, 0, 0, 33, 0, 36, 0, 0, 36, 0, 0, 36, 0,
    31, 0, 0, 31, 0, 0, 31, 0, 35, 0, 0, 35, 0, 0, 35, 0,
    29, 0, 0, 29, 0, 0, 29, 0, 33, 0, 0, 33, 0, 0, 33, 0,
    28, 0, 0, 28, 0, 0, 28, 0, 28, 0, 0, 0, 0, 0, 0, 0,
  ],
  hat: [
    1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0,
    1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0,
    1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0,
    1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0,
  ],
};

// Boss: fast, tense.
const SONG_BOSS: Song = {
  bpm: 150,
  lead: [
    57, 57, 0, 57, 60, 0, 57, 0, 63, 0, 62, 0, 60, 0, 57, 0,
    57, 57, 0, 57, 60, 0, 57, 0, 64, 0, 63, 0, 60, 0, 57, 0,
    55, 55, 0, 55, 58, 0, 55, 0, 61, 0, 60, 0, 58, 0, 55, 0,
    56, 56, 0, 56, 59, 0, 56, 0, 62, 0, 63, 0, 64, 0, 66, 0,
  ],
  bass: [
    33, 0, 33, 0, 33, 0, 33, 33, 33, 0, 33, 0, 33, 0, 33, 33,
    33, 0, 33, 0, 33, 0, 33, 33, 33, 0, 33, 0, 33, 0, 33, 33,
    31, 0, 31, 0, 31, 0, 31, 31, 31, 0, 31, 0, 31, 0, 31, 31,
    32, 0, 32, 0, 32, 0, 32, 32, 32, 0, 32, 0, 32, 0, 32, 32,
  ],
  hat: [
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
  ],
};

// Title / ending: gentle lullaby (la chanson à qui manque un vers).
const SONG_LULLABY: Song = {
  bpm: 96,
  lead: [
    64, 0, 0, 0, 62, 0, 60, 0, 62, 0, 0, 0, 0, 0, 0, 0,
    64, 0, 0, 0, 62, 0, 60, 0, 57, 0, 0, 0, 0, 0, 0, 0,
    60, 0, 0, 0, 62, 0, 64, 0, 65, 0, 0, 0, 64, 0, 62, 0,
    60, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  ],
  bass: [
    36, 0, 0, 0, 43, 0, 0, 0, 40, 0, 0, 0, 43, 0, 0, 0,
    36, 0, 0, 0, 43, 0, 0, 0, 33, 0, 0, 0, 40, 0, 0, 0,
    41, 0, 0, 0, 45, 0, 0, 0, 38, 0, 0, 0, 43, 0, 0, 0,
    36, 0, 0, 0, 43, 0, 0, 0, 36, 0, 0, 0, 0, 0, 0, 0,
  ],
  hat: new Array(64).fill(0) as (0 | 1)[],
};

export const SONGS = {
  forest: SONG_FOREST,
  chains: SONG_CHAINS,
  castle: SONG_CASTLE,
  boss: SONG_BOSS,
  lullaby: SONG_LULLABY,
} as const;

export type SongName = keyof typeof SONGS;

export class GameAudio {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private song: Song | null = null;
  private songName: SongName | null = null;
  private step = 0;
  private nextStepTime = 0;
  private timer: number | null = null;
  muted = false;

  /** Must be called from a user gesture. */
  unlock() {
    if (this.ctx) {
      if (this.ctx.state === "suspended") void this.ctx.resume();
      return;
    }
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctor) return;
    this.ctx = new Ctor();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 0.5;
    this.master.connect(this.ctx.destination);
    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = 0.35;
    this.musicGain.connect(this.master);

    const len = this.ctx.sampleRate * 0.5;
    this.noiseBuffer = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = this.noiseBuffer.getChannelData(0);
    for (let i = 0; i < len; i += 1) data[i] = Math.random() * 2 - 1;

    if (this.songName) this.playSong(this.songName);
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(muted ? 0 : 0.5, this.ctx.currentTime, 0.02);
    }
  }

  playSong(name: SongName) {
    this.songName = name;
    this.song = SONGS[name];
    this.step = 0;
    if (!this.ctx) return;
    this.nextStepTime = this.ctx.currentTime + 0.05;
    if (this.timer === null) {
      this.timer = window.setInterval(() => this.schedule(), 60);
    }
  }

  stopSong() {
    this.songName = null;
    this.song = null;
    if (this.timer !== null) {
      window.clearInterval(this.timer);
      this.timer = null;
    }
  }

  dispose() {
    this.stopSong();
    if (this.ctx) void this.ctx.close();
    this.ctx = null;
  }

  private schedule() {
    if (!this.ctx || !this.song || !this.musicGain) return;
    const stepDur = 60 / this.song.bpm / 4;
    while (this.nextStepTime < this.ctx.currentTime + 0.2) {
      const i = this.step % this.song.lead.length;
      const lead = this.song.lead[i];
      const bass = this.song.bass[i % this.song.bass.length];
      const hat = this.song.hat[i % this.song.hat.length];
      if (lead) this.tone(midi(lead), this.nextStepTime, stepDur * 0.9, "square", 0.12, this.musicGain);
      if (bass) this.tone(midi(bass), this.nextStepTime, stepDur * 1.6, "triangle", 0.3, this.musicGain);
      if (hat) this.noise(this.nextStepTime, 0.03, 0.05, this.musicGain);
      this.nextStepTime += stepDur;
      this.step += 1;
    }
  }

  private tone(
    freq: number,
    time: number,
    duration: number,
    type: OscillatorType,
    volume: number,
    dest?: AudioNode,
    slide = 0,
  ) {
    if (!this.ctx || !this.master) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, time);
    if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(20, freq + slide), time + duration);
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(volume, time + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    osc.connect(gain);
    gain.connect(dest ?? this.master);
    osc.start(time);
    osc.stop(time + duration + 0.02);
  }

  private noise(time: number, duration: number, volume: number, dest?: AudioNode) {
    if (!this.ctx || !this.master || !this.noiseBuffer) return;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    const filter = this.ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = 3000;
    src.connect(filter);
    filter.connect(gain);
    gain.connect(dest ?? this.master);
    src.start(time);
    src.stop(time + duration + 0.02);
  }

  /* ---- sound effects ---- */

  sfx(name: string) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    switch (name) {
      case "jump":
        this.tone(220, t, 0.12, "square", 0.15, undefined, 260);
        break;
      case "throw":
        this.tone(880, t, 0.06, "square", 0.1, undefined, -500);
        this.noise(t, 0.05, 0.08);
        break;
      case "hit":
        this.tone(160, t, 0.2, "sawtooth", 0.2, undefined, -120);
        this.noise(t, 0.15, 0.2);
        break;
      case "armor":
        this.tone(330, t, 0.08, "square", 0.15);
        this.tone(220, t + 0.08, 0.08, "square", 0.15);
        this.noise(t, 0.2, 0.2);
        break;
      case "die":
        for (let i = 0; i < 6; i += 1) {
          this.tone(440 - i * 60, t + i * 0.1, 0.1, "square", 0.15);
        }
        this.noise(t + 0.5, 0.3, 0.25);
        break;
      case "enemy":
        this.tone(200, t, 0.1, "square", 0.12, undefined, -150);
        this.noise(t, 0.08, 0.15);
        break;
      case "chest":
        this.tone(660, t, 0.08, "square", 0.12);
        this.tone(880, t + 0.08, 0.08, "square", 0.12);
        this.tone(1320, t + 0.16, 0.16, "square", 0.12);
        break;
      case "item":
        this.tone(1046, t, 0.07, "square", 0.12);
        this.tone(1318, t + 0.07, 0.07, "square", 0.12);
        this.tone(1568, t + 0.14, 0.12, "square", 0.12);
        break;
      case "checkpoint":
        this.tone(523, t, 0.1, "triangle", 0.25);
        this.tone(659, t + 0.1, 0.1, "triangle", 0.25);
        this.tone(784, t + 0.2, 0.25, "triangle", 0.25);
        break;
      case "bell":
        this.tone(392, t, 0.6, "triangle", 0.3);
        this.tone(784, t, 0.4, "sine", 0.15);
        break;
      case "boss":
        this.tone(110, t, 0.5, "sawtooth", 0.25, undefined, -60);
        this.noise(t, 0.4, 0.3);
        break;
      case "bossHit":
        this.tone(300, t, 0.08, "square", 0.15, undefined, -200);
        break;
      case "timer":
        this.tone(1200, t, 0.05, "square", 0.1);
        break;
      case "select":
        this.tone(660, t, 0.05, "square", 0.1);
        break;
      case "clear":
        [523, 659, 784, 1046, 784, 1046, 1318].forEach((f, i) =>
          this.tone(f, t + i * 0.09, 0.12, "square", 0.14),
        );
        break;
      default:
        break;
    }
  }
}
