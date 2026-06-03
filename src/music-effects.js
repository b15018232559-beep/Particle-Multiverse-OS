const WORLD_EFFECTS = {
  tree: "BRANCH GROWTH",
  vortex: "ACCRETION SPIN",
  reactor: "ENERGY RINGS",
  neural: "NEURAL PULSES",
  tesseract: "SPACE FOLD",
  ultimate: "MULTIVERSE CORE",
};

export class MusicEffects {
  constructor(bus, engine, sceneManager) {
    this.bus = bus;
    this.engine = engine;
    this.sceneManager = sceneManager;
    this.enabled = false;
    this.lastPulse = 0;
    bus.on("MUSIC_MODE_CHANGED", ({ enabled }) => {
      this.enabled = enabled;
      this.engine.setMusicMode(enabled);
      this.bus.emit("effect:changed", enabled ? `MUSIC / ${this.currentEffect()}` : "STABLE");
    });
    bus.on("AUDIO_ANALYSIS", (analysis) => this.apply(analysis));
    bus.on("scene:changed", () => {
      if (this.enabled) this.bus.emit("effect:changed", `MUSIC / ${this.currentEffect()}`);
    });
  }

  apply(analysis) {
    if (!this.enabled) return;
    this.engine.applyMusic(analysis, this.sceneManager.current().behavior);
    if (analysis.beat) {
      this.engine.musicPulse();
      this.bus.emit("MUSIC_PULSE", analysis);
    }
  }

  currentEffect() {
    return WORLD_EFFECTS[this.sceneManager.current().behavior];
  }
}

export { WORLD_EFFECTS };
