const CONTEXT_RULES = {
  STUDY: { worldIndex: 0, world: "AI WORLD TREE", confidence: 0.78 },
  CODING: { worldIndex: 3, world: "NEURAL BRAIN", confidence: 0.88 },
  MUSIC: { worldIndex: 5, world: "ULTIMATE / MUSIC MODE", confidence: 0.98, musicMode: true },
  NIGHT: { worldIndex: 4, world: "TESSERACT", confidence: 0.84 },
  IDLE: { worldIndex: 1, world: "BLACK HOLE", confidence: 0.9 },
  PERFORMANCE_SAVE: { worldIndex: null, world: "FOCUS / LOW QUALITY", confidence: 0.96, quality: "LOW" },
};

export class ContextEngine {
  constructor(bus, sceneManager, performanceManager, options = {}) {
    this.bus = bus;
    this.sceneManager = sceneManager;
    this.performance = performanceManager;
    this.now = options.now ?? (() => Date.now());
    this.intervalMs = options.intervalMs ?? 2000;
    this.autoCooldown = options.autoCooldown ?? 60000;
    this.overrideCooldown = options.overrideCooldown ?? 300000;
    this.idleThreshold = options.idleThreshold ?? 300000;
    this.timer = null;
    this.autoMode = false;
    this.context = "";
    this.intent = "STUDY";
    this.musicPlaying = false;
    this.musicModeEnabled = false;
    this.lowFpsSamples = 0;
    this.lastActivity = this.now();
    this.lastAutoSwitch = -Infinity;
    this.lastUserOverride = -Infinity;
    this.lastSwitch = null;
    this.recommendation = null;

    bus.on("MUSIC_STATE_CHANGED", ({ status }) => {
      this.musicPlaying = status === "PLAYING";
      this.evaluate();
    });
    bus.on("MUSIC_MODE_CHANGED", ({ enabled }) => {
      this.musicModeEnabled = enabled;
    });
    bus.on("USER_SCENE_OVERRIDE", () => {
      this.lastUserOverride = this.now();
      this.markActivity();
    });
  }

  start() {
    if (this.timer) return;
    this.evaluate(true);
    this.timer = setInterval(() => this.evaluate(), this.intervalMs);
  }

  stop() {
    clearInterval(this.timer);
    this.timer = null;
  }

  markActivity() {
    this.lastActivity = this.now();
  }

  updateFps(fps) {
    this.lowFpsSamples = fps < 30 ? this.lowFpsSamples + 1 : 0;
    this.evaluate();
  }

  setIntent(intent) {
    if (intent !== "STUDY" && intent !== "CODING") return;
    this.intent = intent;
    this.markActivity();
    this.evaluate(true);
  }

  toggleAuto() {
    this.setAutoMode(!this.autoMode);
  }

  setAutoMode(enabled) {
    if (this.autoMode === enabled) return;
    this.autoMode = enabled;
    this.bus.emit("AUTO_MODE_TOGGLED", { enabled: this.autoMode });
    this.evaluate(true);
  }

  acceptRecommendation() {
    this.applyRecommendation("accepted", true);
  }

  evaluate(force = false) {
    const next = this.detect();
    const changed = next.context !== this.context || next.world !== this.recommendation?.world;
    this.context = next.context;
    this.recommendation = next;
    if (changed || force) {
      this.bus.emit("CONTEXT_CHANGED", this.state());
      this.bus.emit("CONTEXT_RECOMMENDATION", this.state());
    }
    if (this.autoMode) this.applyRecommendation("auto");
    return next;
  }

  detect() {
    const now = this.now();
    const hour = new Date(now).getHours();
    if (this.musicPlaying) return this.rule("MUSIC");
    if (hour >= 23 || hour < 6) return this.rule("NIGHT");
    if (now - this.lastActivity >= this.idleThreshold) return this.rule("IDLE");
    if (this.lowFpsSamples >= 3) return this.rule("PERFORMANCE_SAVE");
    return this.rule(this.intent);
  }

  rule(context) {
    return { context, ...CONTEXT_RULES[context] };
  }

  applyRecommendation(source, bypassCooldown = false) {
    const recommendation = this.recommendation ?? this.evaluate();
    const now = this.now();
    if (!bypassCooldown) {
      if (now - this.lastAutoSwitch < this.autoCooldown) return false;
      if (now - this.lastUserOverride < this.overrideCooldown) return false;
    }

    let applied = false;
    if (recommendation.quality && this.performance.quality !== recommendation.quality) {
      this.performance.setQuality(recommendation.quality, true);
      applied = true;
    }
    if (recommendation.worldIndex !== null && this.sceneManager.index !== recommendation.worldIndex) {
      this.sceneManager.activate(recommendation.worldIndex, "context");
      applied = true;
    }
    if (recommendation.musicMode && !this.musicModeEnabled) {
      this.bus.emit("CONTEXT_MUSIC_MODE_REQUESTED");
      applied = true;
    }
    if (!applied) return false;

    this.lastSwitch = now;
    if (source === "auto") this.lastAutoSwitch = now;
    this.bus.emit("AUTO_SCENE_SWITCHED", { ...this.state(), source });
    return true;
  }

  state() {
    return {
      context: this.context,
      recommendedWorld: this.recommendation?.world ?? "ANALYZING",
      confidence: this.recommendation?.confidence ?? 0,
      autoMode: this.autoMode,
      lastSwitch: this.lastSwitch,
    };
  }
}

export { CONTEXT_RULES };
