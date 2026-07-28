/**
 * Pre-allocated Audio Buffer Instance Pool.
 */
export class AudioPool {
  /**
   * @param {AudioContext} audioContext 
   * @param {AudioBuffer} audioBuffer 
   * @param {number} [initialSize=8] 
   */
  constructor(audioContext, audioBuffer, initialSize = 8) {
    this.ctx = audioContext;
    this.buffer = audioBuffer;
    this.pool = [];

    for (let i = 0; i < initialSize; i++) {
      this.pool.push(this._createSource());
    }
  }

  _createSource() {
    const src = this.ctx.createBufferSource();
    src.buffer = this.buffer;
    return src;
  }

  play(gainNode, volume = 1.0, loop = false) {
    if (!this.ctx || !this.buffer) return null;

    const source = this.ctx.createBufferSource();
    source.buffer = this.buffer;
    source.loop = loop;

    const localGain = this.ctx.createGain();
    localGain.gain.value = volume;

    source.connect(localGain);
    localGain.connect(gainNode);

    source.start(0);
    return { source, gainNode: localGain };
  }
}
