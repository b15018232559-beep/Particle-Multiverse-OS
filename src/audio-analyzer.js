const clamp = (value) => Math.max(0, Math.min(1, value));

export class AudioAnalyzer {
  constructor(bus, fpsGetter = () => 60) {
    this.bus = bus;
    this.fpsGetter = fpsGetter;
    this.context = null;
    this.analyser = null;
    this.source = null;
    this.frequencyData = null;
    this.timeData = null;
    this.timer = null;
    this.running = false;
    this.energyAverage = 0;
    this.lastBeat = -Infinity;
  }

  connect(audio) {
    if (!this.context) {
      const Context = globalThis.AudioContext || globalThis.webkitAudioContext;
      if (!Context) {
        console.warn("Web Audio API unavailable");
        this.bus.emit("AUDIO_ERROR", { state: "ANALYZER UNAVAILABLE" });
        return false;
      }
      this.context = new Context();
      this.analyser = this.context.createAnalyser();
      this.analyser.fftSize = 1024;
      this.analyser.smoothingTimeConstant = 0.72;
      this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount);
      this.timeData = new Uint8Array(this.analyser.fftSize);
      this.source = this.context.createMediaElementSource(audio);
      this.source.connect(this.analyser);
      this.analyser.connect(this.context.destination);
    }
    return true;
  }

  async resume() {
    if (this.context?.state === "suspended") await this.context.resume();
    this.start();
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.schedule(0);
  }

  stop() {
    this.running = false;
    clearTimeout(this.timer);
    this.timer = null;
  }

  schedule(delay = this.interval()) {
    clearTimeout(this.timer);
    if (!this.running) return;
    this.timer = setTimeout(() => this.tick(), delay);
  }

  tick() {
    if (!this.running || !this.analyser) return;
    this.analyser.getByteFrequencyData(this.frequencyData);
    this.analyser.getByteTimeDomainData(this.timeData);
    this.bus.emit("AUDIO_ANALYSIS", this.measure(this.frequencyData, this.timeData, this.context.sampleRate));
    this.schedule();
  }

  interval() {
    return 1000 / (this.fpsGetter() < 30 ? 15 : 28);
  }

  measure(frequencyData, timeData, sampleRate = 44100) {
    const binHz = sampleRate / (frequencyData.length * 2);
    const averageBand = (low, high) => {
      const start = Math.max(0, Math.floor(low / binHz));
      const end = Math.min(frequencyData.length, Math.ceil(high / binHz));
      if (end <= start) return 0;
      let total = 0;
      for (let index = start; index < end; index += 1) total += frequencyData[index];
      return total / (end - start) / 255;
    };

    let squares = 0;
    for (const sample of timeData) {
      const normalized = (sample - 128) / 128;
      squares += normalized * normalized;
    }
    const volume = clamp(Math.sqrt(squares / timeData.length) * 2.2);
    const bass = clamp(averageBand(35, 180) * 1.35);
    const mid = clamp(averageBand(180, 2200) * 1.2);
    const treble = clamp(averageBand(2200, 12000) * 1.45);
    const energy = clamp(volume * 0.34 + bass * 0.3 + mid * 0.22 + treble * 0.14);
    this.energyAverage = this.energyAverage * 0.92 + energy * 0.08;
    const now = performance.now();
    const beat = bass > Math.max(0.26, this.energyAverage * 1.42) && now - this.lastBeat > 260 ? 1 : 0;
    if (beat) this.lastBeat = now;

    return { volume, bass, mid, treble, beat, energy };
  }
}
