/**
 * Synthesised chiptune audio: no asset files, everything is generated with
 * WebAudio oscillators. Music is a small step sequencer with a square lead,
 * a triangle bass and a noise hat, one pattern per level.
 */

import { ASH_LANTERN_PRAYER, CLOCKWORK_REQUIEM, GIANT_AND_KNIGHT, KNIGHTS_LULLABY } from "./songs";

type Note = number; // MIDI note number, 0 = rest, -1 = hold the previous note

export type Song = {
  bpm: number;
  lead: Note[];
  bass: Note[];
  harm?: Note[];
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

/** Chiptune renditions of the soundtrack: the fallback when the recordings cannot play. */
export const SONGS = {
  forest: ASH_LANTERN_PRAYER,
  cave: GIANT_AND_KNIGHT,
  chains: GIANT_AND_KNIGHT,
  graveyard: ASH_LANTERN_PRAYER,
  castle: SONG_CASTLE,
  boss: CLOCKWORK_REQUIEM,
  lullaby: KNIGHTS_LULLABY,
  forestClassic: SONG_FOREST,
  chainsClassic: SONG_CHAINS,
  bossClassic: SONG_BOSS,
  lullabyClassic: SONG_LULLABY,
} as const;

export type SongName = keyof typeof SONGS;

/** The original recordings by Frank Houbre, one per mood; songs without a file fall back to the chiptune. */
export const TRACKS: Partial<Record<SongName, string>> = {
  forest: "ash-lantern-prayer.mp3",
  cave: "song-of-the-empty-sky.mp3",
  chains: "the-giant-and-the-knight.mp3",
  graveyard: "inexorable-ascent.mp3",
  boss: "clockwork-requiem.mp3",
  lullaby: "the-knights-lullaby.mp3",
};

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
  private musicOn = true;
  private sfxOn = true;
  private trackBase: string | null = null;
  private track: HTMLAudioElement | null = null;
  private trackName: SongName | null = null;
  private fadeTimer: number | null = null;
  muted = false;

  /** Where the recorded tracks live; null keeps the chiptune only. */
  setTrackBase(base: string | null) {
    this.trackBase = base;
  }

  private trackVolume(): number {
    return this.muted || !this.musicOn ? 0 : 0.55;
  }

  /** Cross-fades the recording for a song in; returns false when there is none to play. */
  private playTrack(name: SongName): boolean {
    const file = TRACKS[name];
    if (!this.trackBase || !file) return false;
    if (this.trackName === name && this.track) return true;
    const old = this.track;
    const next = new Audio(`${this.trackBase}/${file}`);
    next.loop = true;
    next.preload = "auto";
    next.volume = 0;
    this.track = next;
    this.trackName = name;
    const started = next.play();
    if (started) started.catch(() => undefined);
    this.fadeTracks(old, next);
    return true;
  }

  private fadeTracks(old: HTMLAudioElement | null, next: HTMLAudioElement | null) {
    if (this.fadeTimer !== null) window.clearInterval(this.fadeTimer);
    let k = 0;
    this.fadeTimer = window.setInterval(() => {
      k += 1;
      const t = Math.min(1, k / 20);
      if (old) old.volume = Math.max(0, (1 - t) * this.trackVolume());
      if (next) next.volume = t * this.trackVolume();
      if (t >= 1) {
        if (old) {
          old.pause();
          old.src = "";
        }
        if (this.fadeTimer !== null) window.clearInterval(this.fadeTimer);
        this.fadeTimer = null;
      }
    }, 50);
  }

  private stopTrack() {
    if (!this.track) return;
    this.fadeTracks(this.track, null);
    this.track = null;
    this.trackName = null;
  }

  /** Recordings need a user gesture too: retry the current one when the page is first touched. */
  private resumeTrack() {
    if (this.track && this.track.paused) {
      const p = this.track.play();
      if (p) p.catch(() => undefined);
    }
  }

  /** Must be called from a user gesture. */
  unlock() {
    this.resumeTrack();
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
    this.musicGain.gain.value = this.musicOn ? 0.35 : 0;
    this.musicGain.connect(this.master);

    const len = this.ctx.sampleRate * 0.5;
    this.noiseBuffer = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = this.noiseBuffer.getChannelData(0);
    for (let i = 0; i < len; i += 1) data[i] = Math.random() * 2 - 1;

    if (this.songName) this.playSong(this.songName);
  }

  setMusicOn(on: boolean) {
    this.musicOn = on;
    if (this.musicGain && this.ctx) this.musicGain.gain.setTargetAtTime(on ? 0.35 : 0, this.ctx.currentTime, 0.02);
    if (this.track) this.track.volume = this.trackVolume();
  }

  setSfxOn(on: boolean) {
    this.sfxOn = on;
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    if (this.track) this.track.volume = this.trackVolume();
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(muted ? 0 : 0.5, this.ctx.currentTime, 0.02);
    }
  }

  playSong(name: SongName) {
    if (this.playTrack(name)) {
      // The recording carries the music; the sequencer stays quiet.
      this.songName = name;
      this.song = null;
      return;
    }
    this.stopTrack();
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
    this.stopTrack();
    this.songName = null;
    this.song = null;
    if (this.timer !== null) {
      window.clearInterval(this.timer);
      this.timer = null;
    }
  }

  dispose() {
    this.stopSong();
    if (this.track) {
      this.track.pause();
      this.track.src = "";
      this.track = null;
    }
    if (this.ctx) void this.ctx.close();
    this.ctx = null;
  }

  private schedule() {
    if (!this.ctx || !this.song || !this.musicGain) return;
    const stepDur = 60 / this.song.bpm / 4;
    const song = this.song;
    // A note lasts its own step plus every following hold step.
    const held = (track: Note[], i: number) => {
      let n = 1;
      while (n < 64 && track[(i + n) % track.length] === -1) n += 1;
      return n;
    };
    while (this.nextStepTime < this.ctx.currentTime + 0.2) {
      const i = this.step % song.lead.length;
      const lead = song.lead[i];
      const bass = song.bass[i % song.bass.length];
      const harm = song.harm ? song.harm[i % song.harm.length] : 0;
      const hat = song.hat[i % song.hat.length];
      const t = this.nextStepTime;
      if (lead > 0) this.tone(midi(lead), t, stepDur * held(song.lead, i) * 0.92, "square", 0.11, this.musicGain);
      if (bass > 0) this.tone(midi(bass), t, stepDur * Math.min(8, held(song.bass, i % song.bass.length)) * 0.95, "triangle", 0.28, this.musicGain);
      if (harm > 0 && song.harm) this.tone(midi(harm), t, stepDur * held(song.harm, i % song.harm.length) * 0.9, "triangle", 0.09, this.musicGain);
      if (hat) this.noise(t, 0.03, 0.04, this.musicGain);
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
    if (!this.ctx || !this.sfxOn) return;
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
      case "roll":
        this.noise(t, 0.16, 0.14);
        this.tone(140, t, 0.14, "triangle", 0.18, undefined, 90);
        break;
      case "charge":
        this.tone(660, t, 0.12, "square", 0.1, undefined, 660);
        this.tone(1320, t + 0.1, 0.18, "sine", 0.12);
        break;
      case "big":
        this.tone(90, t, 0.35, "sawtooth", 0.3, undefined, -50);
        this.tone(1760, t, 0.1, "square", 0.12, undefined, -900);
        this.noise(t, 0.3, 0.3);
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
