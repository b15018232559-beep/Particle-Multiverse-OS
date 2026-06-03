const AGENT_STATUS = { ACTIVE: "ACTIVE", IDLE: "IDLE", DISABLED: "DISABLED", ERROR: "ERROR" };

export class AgentManager {
  constructor(bus, options = {}) {
    this.bus = bus;
    this.now = options.now ?? (() => Date.now());
    this.cooldownMs = options.cooldownMs ?? 30000;
    this.dismissCooldownMs = options.dismissCooldownMs ?? 300000;
    this.agents = new Map();
    this.suggestions = [];
    this.lastSuggestedAt = new Map();
    this.dismissedUntil = new Map();
    this.enabled = true;
    this.state = { currentContext: "STUDY", musicMode: false, lowPerformance: false, focusMode: false, quietMode: false };
  }

  register(agent) {
    const metadata = agent.getMetadata();
    if (!metadata?.id || this.agents.has(metadata.id)) return false;
    for (const method of ["init", "enable", "disable", "getStatus", "getSuggestions", "handleEvent"]) {
      if (typeof agent[method] !== "function") throw new Error(`Agent lifecycle missing: ${method}`);
    }
    agent.init();
    this.agents.set(metadata.id, agent);
    this.bus.emit("AGENT_REGISTERED", { agent: metadata.name, id: metadata.id, status: agent.getStatus() });
    this.emitStatus();
    return true;
  }

  enable(id, source = "system") {
    const agent = this.agents.get(id);
    if (!agent || !this.enabled) return false;
    try {
      agent.enable();
      this.bus.emit("AGENT_ENABLED", { agent: agent.getMetadata().name, id, status: agent.getStatus(), source });
      this.emitStatus();
      return true;
    } catch (error) {
      return this.fail(id, error);
    }
  }

  disable(id, source = "system") {
    const agent = this.agents.get(id);
    if (!agent) return false;
    try {
      agent.disable();
      this.bus.emit("AGENT_DISABLED", { agent: agent.getMetadata().name, id, status: agent.getStatus(), source });
      this.emitStatus();
      return true;
    } catch (error) {
      return this.fail(id, error);
    }
  }

  disableAll(source = "system") {
    for (const id of this.agents.keys()) this.disable(id, source);
    return true;
  }

  setEnabled(enabled) {
    this.enabled = Boolean(enabled);
    if (!this.enabled) this.disableAll("agent-plugin");
    this.emitStatus();
  }

  setState(patch) { Object.assign(this.state, patch); }

  activateForContext(context) {
    this.setState({ currentContext: context, musicMode: context === "MUSIC", lowPerformance: context === "PERFORMANCE_SAVE", focusMode: ["STUDY", "CODING"].includes(context), quietMode: context === "NIGHT" });
    if (!this.enabled || context === "MUSIC") return this.disableAll("context");
    for (const id of ["study-agent", "coding-agent", "automation-agent"]) this.disable(id, "context");
    if (context === "STUDY") this.enable("study-agent", "context");
    if (context === "CODING") this.enable("coding-agent", "context");
    if (context === "PERFORMANCE_SAVE") this.enable("automation-agent", "context");
    return true;
  }

  collectSuggestions(id = null, source = "system") {
    if (!this.enabled || this.state.musicMode) return [];
    const agents = id ? [this.agents.get(id)].filter(Boolean) : [...this.agents.values()];
    const created = [];
    for (const agent of agents) {
      if (agent.getStatus() !== AGENT_STATUS.ACTIVE) continue;
      const agentId = agent.getMetadata().id;
      const now = this.now();
      if (now < (this.dismissedUntil.get(agentId) ?? 0)) continue;
      const cooldown = this.cooldownMs * (this.state.focusMode ? 2 : 1) * (this.state.quietMode ? 4 : 1);
      if (now - (this.lastSuggestedAt.get(agentId) ?? -Infinity) < cooldown) continue;
      try {
        const suggestions = agent.getSuggestions(this.state) ?? [];
        for (const draft of suggestions) {
          if (this.state.lowPerformance && draft.priority !== "high") continue;
          const suggestion = { id: `${agentId}:${now}`, agent: agent.getMetadata().name, agentId, type: "suggestion", priority: "medium", ...draft, source, createdAt: now };
          this.suggestions.unshift(suggestion);
          this.lastSuggestedAt.set(agentId, now);
          this.bus.emit("AGENT_SUGGESTION_CREATED", suggestion);
          created.push(suggestion);
          break;
        }
      } catch (error) {
        this.fail(agentId, error);
      }
    }
    this.emitStatus();
    return created;
  }

  acceptSuggestion(id) {
    const suggestion = this.suggestions.find((item) => item.id === id);
    if (!suggestion) return false;
    suggestion.accepted = true;
    this.bus.emit("AGENT_SUGGESTION_ACCEPTED", suggestion);
    this.bus.emit("AGENT_ACTION_REQUESTED", suggestion);
    this.emitStatus();
    return true;
  }

  dismissSuggestion(id) {
    const suggestion = this.suggestions.find((item) => item.id === id);
    if (!suggestion) return false;
    suggestion.dismissed = true;
    this.dismissedUntil.set(suggestion.agentId, this.now() + this.dismissCooldownMs);
    this.bus.emit("AGENT_SUGGESTION_DISMISSED", suggestion);
    this.emitStatus();
    return true;
  }

  list() {
    return [...this.agents.values()].map((agent) => ({ ...agent.getMetadata(), status: agent.getStatus() }));
  }

  summary() {
    return { enabled: this.enabled, agents: this.list(), suggestions: this.suggestions.filter((item) => !item.accepted && !item.dismissed).slice(0, 6) };
  }

  fail(id, error) {
    const agent = this.agents.get(id);
    try { agent?.disable(); } catch {}
    try { agent?.setError?.(error); } catch {}
    this.bus.emit("AGENT_ERROR", { agent: agent?.getMetadata?.().name ?? id, id, status: AGENT_STATUS.ERROR, message: error.message, error });
    this.emitStatus();
    return false;
  }

  emitStatus() { this.bus.emit("AGENT_STATUS_CHANGED", this.summary()); }
}

export { AGENT_STATUS };
