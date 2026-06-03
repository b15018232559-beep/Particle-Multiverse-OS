export class UltimateDashboard {
  constructor(bus, root, options = {}) {
    this.bus = bus;
    this.root = root;
    this.intervalMs = options.intervalMs ?? 200;
    this.timer = null;
    this.open = false;
    this.plugins = [];
    this.state = {
      system: "ONLINE", world: "AI WORLD TREE", fps: 60, quality: "HIGH", particles: 0,
      music: "OFF", camera: "OFF", hand: "OFF", context: "ANALYZING", autoMode: "OFF", health: "OK",
      pluginTotal: 0, pluginEnabled: 0, pluginDisabled: 0, pluginErrors: 0,
      agents: 0, teamAgents: 0, tasks: 0, memory: "LOCAL", performance: "60 FPS",
      edition: "ULTIMATE", release: "v2.0", codename: "World Tree Remaster", baseline: "v1.0 preserved",
      favoriteScene: "AI WORLD TREE", mostUsedScene: "AI WORLD TREE", lastScene: "AI WORLD TREE",
      totalUsageTime: "00:00:00", lastVisit: "NEVER", savedWorkspaces: 4,
      recommendedScene: "AI WORLD TREE", recommendedQuality: "HIGH", recommendedWorkspace: "Custom Workspace",
    };
    bus.on("scene:changed", ({ preset }) => { this.state.world = preset.name; });
    bus.on("MUSIC_STATE_CHANGED", ({ status }) => { this.state.music = status; });
    bus.on("CAMERA_STARTED", () => { this.state.camera = "ONLINE"; });
    bus.on("CAMERA_STOPPED", () => { this.state.camera = "OFF"; this.state.hand = "OFF"; });
    bus.on("CAMERA_ERROR", () => { this.state.camera = "ERROR"; });
    bus.on("HAND_DETECTED", () => { this.state.hand = "DETECTED"; });
    bus.on("HAND_LOST", () => { this.state.hand = "LOST"; });
    bus.on("CONTEXT_CHANGED", ({ context }) => { this.state.context = context; });
    bus.on("AUTO_MODE_TOGGLED", ({ enabled }) => { this.state.autoMode = enabled ? "ON" : "OFF"; });
    bus.on("SYSTEM_HEALTH_CHANGED", ({ health }) => {
      this.state.health = health;
      this.state.system = health === "CRITICAL" ? "ERROR" : health === "WARNING" ? "WARNING" : "ONLINE";
      this.root.classList.toggle("low-power", health !== "OK");
    });
    bus.on("PLUGIN_STATUS_CHANGED", ({ summary }) => {
      this.state.pluginTotal = summary.total;
      this.state.pluginEnabled = summary.enabled;
      this.state.pluginDisabled = summary.disabled;
      this.state.pluginErrors = summary.errors;
      this.plugins = summary.plugins;
    });
    bus.on("AGENT_STATUS_CHANGED", ({ agents = [] }) => {
      this.state.agents = agents.length;
    });
    bus.on("MULTI_AGENT_STATUS_CHANGED", ({ agents = [], tasks = [] }) => {
      this.state.teamAgents = agents.length;
      this.state.tasks = tasks.length;
    });
    for (const event of ["MEMORY_LOADED", "MEMORY_SAVED", "MEMORY_CLEARED"]) {
      bus.on(event, (summary) => this.updateMemory(summary));
    }
    bus.on("PREFERENCE_UPDATED", ({ scene, quality, workspace }) => {
      this.state.recommendedScene = scene;
      this.state.recommendedQuality = quality;
      this.state.recommendedWorkspace = workspace;
    });
    bus.on("ULTIMATE_EDITION_READY", ({ release, codename, profile, baseline }) => {
      this.state.edition = profile;
      this.state.release = release;
      this.state.codename = codename;
      this.state.baseline = baseline;
      this.render();
    });
  }

  start() { if (!this.timer) this.timer = setInterval(() => this.render(), this.intervalMs); }
  stop() { clearInterval(this.timer); this.timer = null; }
  toggle() { this.setOpen(!this.open); }
  setOpen(open) {
    this.open = Boolean(open);
    this.root.classList.toggle("open", this.open);
    this.render();
    this.bus.emit("DASHBOARD_TOGGLED", { open: this.open });
  }
  updateMetrics({ fps, quality, particles }) {
    Object.assign(this.state, { fps, quality, particles, performance: `${fps} FPS / ${quality}` });
  }
  updateMemory({ profile = {}, lastScene, savedWorkspaces, ranking = [] }) {
    const seconds = Math.floor((profile.totalUsageTime ?? 0) / 1000);
    this.state.favoriteScene = profile.favoriteScene ?? "AI WORLD TREE";
    this.state.mostUsedScene = profile.mostUsedScene ?? ranking[0]?.name ?? "AI WORLD TREE";
    this.state.lastScene = lastScene ?? "AI WORLD TREE";
    this.state.totalUsageTime = new Date(seconds * 1000).toISOString().slice(11, 19);
    this.state.lastVisit = profile.lastVisit ? new Date(profile.lastVisit).toLocaleString() : "NEVER";
    this.state.savedWorkspaces = savedWorkspaces ?? 0;
    this.state.memory = `${this.state.savedWorkspaces} WORKSPACES`;
    const rankingElement = this.root.querySelector("#memory-ranking");
    if (rankingElement) rankingElement.textContent = ranking.slice(0, 3).map(({ name, duration }) => `${name}: ${Math.floor(duration / 1000)}s`).join(" / ");
  }
  render() {
    for (const [key, value] of Object.entries(this.state)) {
      const element = this.root.querySelector(`[data-dashboard="${key}"]`);
      if (element) element.textContent = value;
    }
    const pluginStatuses = this.root.querySelector("#dashboard-plugin-statuses");
    if (pluginStatuses) pluginStatuses.textContent = this.plugins.map(({ id, status }) => `${id}: ${status}`).join(" / ");
  }
}
