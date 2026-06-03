export class MissionControl {
  constructor(bus, router, root, providers = {}, options = {}) {
    this.bus = bus;
    this.router = router;
    this.root = root;
    this.providers = providers;
    this.intervalMs = options.intervalMs ?? 200;
    this.open = false;
    this.renderTimer = null;
    this.state = this.readState();
    this.bind();
  }

  bind() {
    this.root.querySelector("#mission-close")?.addEventListener("click", () => this.setOpen(false));
    this.root.querySelector("#mission-create-task")?.addEventListener("click", () => {
      this.router.dispatch("createMultiAgentTask", { title: "Mission Control system review" }, "mission-control");
      this.setOpen(true);
    });
    this.root.querySelector("#mission-start-task")?.addEventListener("click", () => {
      this.router.dispatch("startCollaboration", {}, "mission-control");
      this.setOpen(true);
    });
    for (const event of [
      "scene:changed", "PLUGIN_STATUS_CHANGED", "AGENT_STATUS_CHANGED", "MULTI_AGENT_STATUS_CHANGED",
      "MEMORY_LOADED", "MEMORY_SAVED", "MEMORY_CLEARED", "SYSTEM_HEALTH_CHANGED", "CONTEXT_CHANGED",
      "MUSIC_STATE_CHANGED", "CAMERA_STARTED", "CAMERA_STOPPED", "VOICE_STATE_CHANGED", "QUALITY_CHANGED",
    ]) {
      this.bus.on(event, () => this.scheduleRender());
    }
    this.root.addEventListener("click", (event) => {
      const target = event.target.closest("[data-mission-action]");
      if (!target) return;
      const action = target.dataset.missionAction;
      const payload = target.dataset.payload ? JSON.parse(target.dataset.payload) : {};
      this.router.dispatch(action, payload, "mission-control");
    });
  }

  toggle() {
    this.setOpen(!this.open);
  }

  setOpen(open) {
    this.open = Boolean(open);
    this.root.classList.toggle("open", this.open);
    document.body.classList.toggle("mission-open", this.open);
    if (this.open) this.render();
    this.bus.emit("MISSION_CONTROL_TOGGLED", { open: this.open });
  }

  scheduleRender() {
    if (!this.open || this.renderTimer) return;
    this.renderTimer = setTimeout(() => {
      this.renderTimer = null;
      this.render();
    }, this.intervalMs);
  }

  readState() {
    return {
      worlds: this.providers.getWorlds?.() ?? [],
      scene: this.providers.getScene?.() ?? null,
      agents: this.providers.getAgents?.() ?? [],
      team: this.providers.getTeam?.() ?? { agents: [], tasks: [], taskBoard: {}, discussion: [] },
      plugins: this.providers.getPlugins?.() ?? [],
      workspaces: this.providers.getWorkspaces?.() ?? {},
      memory: this.providers.getMemory?.() ?? {},
      health: this.providers.getHealth?.() ?? {},
      performance: this.providers.getPerformance?.() ?? {},
      systems: this.providers.getSystems?.() ?? {},
      edition: this.providers.getEdition?.() ?? {},
    };
  }

  render() {
    this.state = this.readState();
    this.renderWorlds();
    this.renderAgents();
    this.renderTasks();
    this.renderPlugins();
    this.renderWorkspaces();
    this.renderSystems();
  }

  renderWorlds() {
    const list = this.root.querySelector("#mission-worlds");
    if (!list) return;
    list.replaceChildren(...this.state.worlds.map((world, index) => {
      const button = document.createElement("button");
      button.className = index === this.state.scene?.index ? "mission-card active" : "mission-card";
      button.dataset.missionAction = "switchScene";
      button.dataset.payload = JSON.stringify({ index });
      this.fillCard(button, world.name, world.subtitle, world.interaction);
      return button;
    }));
  }

  renderAgents() {
    const list = this.root.querySelector("#mission-agents");
    if (!list) return;
    const agents = [
      ...this.state.agents.map((agent) => ({ name: agent.name, status: agent.status, type: "Assistant" })),
      ...this.state.team.agents.map((agent) => ({ name: agent.name, status: agent.status, type: "Team" })),
    ];
    list.replaceChildren(...agents.map((agent) => this.card(agent.name, agent.type, agent.status)));
  }

  renderTasks() {
    const list = this.root.querySelector("#mission-tasks");
    if (!list) return;
    const statuses = ["PENDING", "RUNNING", "COMPLETED", "FAILED"];
    list.replaceChildren(...statuses.map((status) => {
      const count = this.state.team.taskBoard?.[status]?.length ?? 0;
      return this.card(status, `${count} task${count === 1 ? "" : "s"}`, status);
    }));
  }

  renderPlugins() {
    const list = this.root.querySelector("#mission-plugins");
    if (!list) return;
    list.replaceChildren(...this.state.plugins.map((plugin) => this.card(plugin.name ?? plugin.id, plugin.id, plugin.status)));
  }

  renderWorkspaces() {
    const list = this.root.querySelector("#mission-workspaces");
    if (!list) return;
    list.replaceChildren(...Object.entries(this.state.workspaces).map(([id, workspace]) => {
      const button = this.card(workspace.name ?? id, workspace.sceneName ?? "Workspace", id.toUpperCase());
      button.dataset.missionAction = "loadWorkspace";
      button.dataset.payload = JSON.stringify({ id });
      return button;
    }));
  }

  renderSystems() {
    const list = this.root.querySelector("#mission-systems");
    if (!list) return;
    const systems = [
      ["Scene", this.state.scene?.name ?? "UNKNOWN", "Visual Layer"],
      ["Music", this.state.systems.music ?? "OFF", "Interaction Layer"],
      ["Camera", this.state.systems.camera ?? "OFF", "Interaction Layer"],
      ["Gesture", this.state.systems.gesture ?? "READY", "Interaction Layer"],
      ["Voice", this.state.systems.voice ?? "OFF", "Interaction Layer"],
      ["Memory", `${Object.keys(this.state.workspaces).length} workspaces`, "Intelligence Layer"],
      ["Context", this.state.systems.context ?? "ANALYZING", "Intelligence Layer"],
      ["Health", this.state.health.health ?? "OK", "Operating Layer"],
      ["Performance", `${this.state.performance.fps ?? 60} FPS / ${this.state.performance.quality ?? "HIGH"}`, "Operating Layer"],
      ["Edition", this.state.edition.release ?? "v2.0", this.state.edition.profile ?? "ULTIMATE"],
      ["Codename", this.state.edition.codename ?? "World Tree Remaster", "Release Layer"],
      ["Baseline", this.state.edition.baseline ?? "v1.0 preserved", "Release Layer"],
    ];
    list.replaceChildren(...systems.map(([name, value, layer]) => this.card(name, layer, value)));
  }

  card(title, subtitle, status) {
    const item = document.createElement("button");
    item.className = `mission-card status-${String(status).toLowerCase().replace(/\s+/g, "-")}`;
    this.fillCard(item, title, subtitle, status);
    return item;
  }

  fillCard(item, title, subtitle, status) {
    const heading = document.createElement("b");
    const sub = document.createElement("span");
    const small = document.createElement("small");
    heading.textContent = title;
    sub.textContent = subtitle;
    small.textContent = status;
    item.replaceChildren(heading, sub, small);
    return item;
  }
}
