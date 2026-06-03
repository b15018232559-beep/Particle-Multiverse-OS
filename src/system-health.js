export class SystemHealth {
  constructor(bus, options = {}) {
    this.bus = bus;
    this.intervalMs = options.intervalMs ?? 2000;
    this.timer = null;
    this.state = {
      fps: 60, renderedAt: Date.now(), music: "OFF", camera: "OFF", hand: "OFF",
      context: "ANALYZING", eventBus: true, animationLoops: 0, duplicateListeners: 0, lowFpsChecks: 0,
      pluginError: null, agentError: null, voice: "OFF", memory: "LOCAL", tasksFailed: 0,
    };
    bus.on("MUSIC_STATE_CHANGED", ({ status }) => { this.state.music = status; });
    bus.on("AUDIO_ERROR", () => { this.state.music = "ERROR"; });
    bus.on("CAMERA_STARTED", () => { this.state.camera = "ONLINE"; });
    bus.on("CAMERA_STOPPED", () => { this.state.camera = "OFF"; this.state.hand = "OFF"; });
    bus.on("CAMERA_ERROR", () => { this.state.camera = "ERROR"; });
    bus.on("HAND_DETECTED", () => { this.state.hand = "DETECTED"; });
    bus.on("HAND_LOST", () => { this.state.hand = "LOST"; });
    bus.on("CONTEXT_CHANGED", ({ context }) => { this.state.context = context; });
    bus.on("PLUGIN_ERROR", ({ id }) => { this.state.pluginError = id; });
    bus.on("AGENT_ERROR", ({ id }) => { this.state.agentError = id ?? "agent"; });
    bus.on("VOICE_STATE_CHANGED", ({ state }) => { this.state.voice = state; });
    bus.on("VOICE_ERROR", ({ state }) => { this.state.voice = state; });
    bus.on("MEMORY_LOADED", () => { this.state.memory = "LOCAL"; });
    bus.on("MEMORY_ERROR", () => { this.state.memory = "ERROR"; });
    bus.on("MULTI_AGENT_STATUS_CHANGED", ({ taskBoard = {} }) => { this.state.tasksFailed = taskBoard.FAILED?.length ?? 0; });
    bus.on("PLUGIN_ENABLED", ({ id }) => {
      if (this.state.pluginError === id) this.state.pluginError = null;
    });
    bus.on("AGENT_ENABLED", ({ id }) => {
      if (this.state.agentError === id) this.state.agentError = null;
    });
  }

  start() {
    if (this.timer) return;
    this.timer = setInterval(() => this.check(), this.intervalMs);
    this.check();
  }

  stop() { clearInterval(this.timer); this.timer = null; }
  recordFrame(fps) { this.state.fps = fps; this.state.renderedAt = Date.now(); }
  registerAnimationLoop() { this.state.animationLoops += 1; }
  setDuplicateListeners(count) { this.state.duplicateListeners = count; }

  check() {
    const issues = [];
    this.state.lowFpsChecks = this.state.fps < 30 ? this.state.lowFpsChecks + 1 : 0;
    if (this.state.lowFpsChecks >= 3) issues.push("LOW FPS");
    if (Date.now() - this.state.renderedAt > 2500) issues.push("RENDER STALLED");
    if (this.state.camera === "ERROR") issues.push("CAMERA ERROR");
    if (this.state.music === "ERROR") issues.push("MUSIC ERROR");
    if (this.state.voice === "ERROR") issues.push("VOICE ERROR");
    if (this.state.memory === "ERROR") issues.push("MEMORY ERROR");
    if (!this.state.context) issues.push("CONTEXT ERROR");
    if (!this.state.eventBus) issues.push("EVENT BUS ERROR");
    if (this.state.animationLoops !== 1) issues.push("ANIMATION LOOP");
    if (this.state.duplicateListeners > 0) issues.push("DUPLICATE LISTENERS");
    if (this.state.pluginError) issues.push(`PLUGIN ERROR: ${this.state.pluginError}`);
    if (this.state.agentError) issues.push(`AGENT ERROR: ${this.state.agentError}`);
    if (this.state.tasksFailed > 0) issues.push(`TASK FAILED: ${this.state.tasksFailed}`);
    const health = issues.some((issue) => issue.includes("ERROR") || issue.includes("STALLED") || issue.includes("LOOP")) ? "CRITICAL" : issues.length ? "WARNING" : "OK";
    this.lastHealth = { health, issues, ...this.state };
    this.bus.emit("SYSTEM_HEALTH_CHANGED", this.lastHealth);
    return { health, issues };
  }
}
