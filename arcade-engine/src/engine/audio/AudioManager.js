import { AudioPool } from './AudioPool.js';

/**
 * Web Audio API Manager supporting channels, volume control, mute, and crossfade.
 */
export class AudioManager {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.uiGain = null;

    /** @type {Map<string, AudioBuffer>} */
    this.soundBuffers = new Map();
    /** @type {Map<string, AudioPool>} */
    this.audioPools = new Map();

    /** @type {{ source: AudioBufferSourceNode, gainNode: GainNode } | null} Active Music Source */
    this.activeMusic = null;

    this.isMuted = false;
    this.masterVolume = 1.0;
    this.musicVolume = 0.8;
    this.sfxVolume = 1.0;
    this.uiVolume = 1.0;

    this._initAudioContext();
  }

  _initAudioContext() {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    this.ctx = new AudioCtx();

    this.masterGain = this.ctx.createGain();
    this.musicGain = this.ctx.createGain();
    this.sfxGain = this.ctx.createGain();
    this.uiGain = this.ctx.createGain();

    this.musicGain.connect(this.masterGain);
    this.sfxGain.connect(this.masterGain);
    this.uiGain.connect(this.masterGain);
    this.masterGain.connect(this.ctx.destination);

    this.updateVolumes();

    // Unlock WebAudio on user interaction
    const unlock = () => {
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      window.removeEventListener('click', unlock);
      window.removeEventListener('keydown', unlock);
      window.removeEventListener('touchstart', unlock);
    };

    window.addEventListener('click', unlock);
    window.addEventListener('keydown', unlock);
    window.addEventListener('touchstart', unlock);
  }

  updateVolumes() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.masterVolume, now);
    this.musicGain.gain.setValueAtTime(this.musicVolume, now);
    this.sfxGain.gain.setValueAtTime(this.sfxVolume, now);
    this.uiGain.gain.setValueAtTime(this.uiVolume, now);
  }

  registerSound(name, audioBuffer) {
    this.soundBuffers.set(name, audioBuffer);
    if (this.ctx) {
      this.audioPools.set(name, new AudioPool(this.ctx, audioBuffer, 6));
    }
  }

  playSFX(name, volume = 1.0) {
    if (this.isMuted || !this.ctx) return null;
    const pool = this.audioPools.get(name);
    if (pool) {
      return pool.play(this.sfxGain, volume, false);
    }
    return null;
  }

  playUI(name, volume = 1.0) {
    if (this.isMuted || !this.ctx) return null;
    const pool = this.audioPools.get(name);
    if (pool) {
      return pool.play(this.uiGain, volume, false);
    }
    return null;
  }

  playMusic(name, volume = 0.8, fadeDurationSec = 1.0) {
    if (!this.ctx) return;
    const buffer = this.soundBuffers.get(name);
    if (!buffer) return;

    // Fade out active music if playing
    if (this.activeMusic) {
      const oldMusic = this.activeMusic;
      const now = this.ctx.currentTime;
      oldMusic.gainNode.gain.setValueAtTime(oldMusic.gainNode.gain.value, now);
      oldMusic.gainNode.gain.linearRampToValueAtTime(0.001, now + fadeDurationSec);
      setTimeout(() => {
        try { oldMusic.source.stop(); } catch (e) {}
      }, fadeDurationSec * 1000);
    }

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const gainNode = this.ctx.createGain();
    const now = this.ctx.currentTime;
    gainNode.gain.setValueAtTime(0.001, now);
    gainNode.gain.linearRampToValueAtTime(volume, now + fadeDurationSec);

    source.connect(gainNode);
    gainNode.connect(this.musicGain);
    source.start(0);

    this.activeMusic = { source, gainNode };
  }

  setMute(mute) {
    this.isMuted = mute;
    this.updateVolumes();
  }

  setMasterVolume(vol) {
    this.masterVolume = Math.max(0, Math.min(1, vol));
    this.updateVolumes();
  }

  destroy() {
    if (this.activeMusic) {
      try { this.activeMusic.source.stop(); } catch (e) {}
      this.activeMusic = null;
    }
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
    }
    this.soundBuffers.clear();
    this.audioPools.clear();
  }
}
