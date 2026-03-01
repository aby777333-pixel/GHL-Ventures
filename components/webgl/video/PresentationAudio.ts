/* PresentationAudio — Ambient cinematic audio using Web Audio API
   Creates a warm, professional ambient pad without external audio files. */

export class PresentationAudio {
  private ctx: AudioContext | null = null
  private masterGain: GainNode | null = null
  private sources: (OscillatorNode | AudioBufferSourceNode)[] = []
  private nodes: AudioNode[] = []
  private _muted = false

  async start(): Promise<void> {
    if (this.ctx) return

    this.ctx = new AudioContext()
    await this.ctx.resume()

    this.masterGain = this.ctx.createGain()
    this.masterGain.gain.value = 0.1
    this.masterGain.connect(this.ctx.destination)

    // Deep foundation pad (C2)
    this.addOsc(65.41, 'sine', 0.2, 180)
    // Warm octave (C3)
    this.addOsc(130.81, 'sine', 0.08, 300)
    // Perfect fifth for richness (G3)
    this.addOsc(196.0, 'sine', 0.04, 400)
    // Shimmer pair — slightly detuned for chorus (E4)
    this.addOsc(329.0, 'sine', 0.02, 600)
    this.addOsc(331.5, 'sine', 0.015, 600)
    // Noise texture for cinematic depth
    this.addNoiseLayer()
  }

  private addOsc(freq: number, type: OscillatorType, gain: number, cutoff: number) {
    if (!this.ctx || !this.masterGain) return

    const osc = this.ctx.createOscillator()
    osc.type = type
    osc.frequency.value = freq

    const filter = this.ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = cutoff
    filter.Q.value = 0.5

    const g = this.ctx.createGain()
    g.gain.value = gain

    osc.connect(filter)
    filter.connect(g)
    g.connect(this.masterGain)
    osc.start()

    this.sources.push(osc)
    this.nodes.push(filter, g)
  }

  private addNoiseLayer() {
    if (!this.ctx || !this.masterGain) return

    const len = this.ctx.sampleRate * 2
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate)
    const data = buf.getChannelData(0)
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * 0.008

    const src = this.ctx.createBufferSource()
    src.buffer = buf
    src.loop = true

    const filter = this.ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.value = 900
    filter.Q.value = 0.4

    const g = this.ctx.createGain()
    g.gain.value = 0.12

    src.connect(filter)
    filter.connect(g)
    g.connect(this.masterGain)
    src.start()

    this.sources.push(src)
    this.nodes.push(filter, g)
  }

  get muted() { return this._muted }

  toggleMute(): boolean {
    this._muted = !this._muted
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(
        this._muted ? 0 : 0.1,
        this.ctx.currentTime,
        0.1
      )
    }
    return this._muted
  }

  stop() {
    this.sources.forEach(s => { try { s.stop() } catch { /* already stopped */ } })
    this.sources = []
    this.nodes = []
    if (this.ctx) {
      this.ctx.close().catch(() => {})
      this.ctx = null
    }
    this.masterGain = null
    this._muted = false
  }
}
