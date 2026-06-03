const STORAGE_KEY = "particle-multiverse-os:v7:workspace-memory";
const WORLD_NAMES = ["AI WORLD TREE", "BLACK HOLE", "ARC REACTOR", "NEURAL BRAIN", "TESSERACT", "ULTIMATE"];

const DEFAULT_PROFILE = {
  favoriteScene: "AI WORLD TREE",
  mostUsedScene: "AI WORLD TREE",
  favoriteQuality: "HIGH",
  favoriteInteraction: "ATTRACT",
  totalUsageTime: 0,
  lastVisit: null,
};

const DEFAULT_WORKSPACES = {
  study: { name: "Study Workspace", scene: 0, sceneName: WORLD_NAMES[0], quality: "HIGH", musicMode: false, autoMode: false },
  coding: { name: "Coding Workspace", scene: 3, sceneName: WORLD_NAMES[3], quality: "HIGH", musicMode: false, autoMode: false },
  research: { name: "Research Workspace", scene: 3, sceneName: WORLD_NAMES[3], quality: "HIGH", musicMode: false, autoMode: false },
  music: { name: "Music Workspace", scene: 5, sceneName: WORLD_NAMES[5], quality: "HIGH", musicMode: true, autoMode: false },
  night: { name: "Night Workspace", scene: 4, sceneName: WORLD_NAMES[4], quality: "MEDIUM", musicMode: false, autoMode: false },
};

function freshMemory(now) {
  return {
    version: 1,
    current: null,
    latestWorkspace: null,
    workspaces: structuredClone(DEFAULT_WORKSPACES),
    profile: { ...DEFAULT_PROFILE },
    analytics: Object.fromEntries(WORLD_NAMES.map((name) => [name, 0])),
    agentMemory: { recentAgent: null, suggestionHistory: [], acceptedSuggestions: [], dismissedSuggestions: [], usage: {} },
    multiAgentMemory: { recentAgent: null, taskHistory: [], agentHistory: [], discussion: [], usage: {} },
    createdAt: now,
    updatedAt: now,
  };
}

export class WorkspaceMemory {
  constructor(bus, adapters, options = {}) {
    this.bus = bus;
    this.adapters = adapters;
    this.storage = options.storage ?? globalThis.localStorage;
    this.now = options.now ?? (() => Date.now());
    this.key = options.key ?? STORAGE_KEY;
    this.data = freshMemory(this.now());
    this.loaded = false;
    this.enabled = true;
    this.saveQueued = false;
    this.saveVersion = 0;
    this.sceneEnteredAt = this.now();
    this.lastSceneName = WORLD_NAMES[0];
    this.bind();
  }

  bind() {
    this.bus.on("scene:changed", ({ preset }) => {
      this.recordSceneTime();
      this.lastSceneName = preset.name;
      this.sceneEnteredAt = this.now();
      this.queueSave();
    });
    for (const event of ["MUSIC_STATE_CHANGED", "MUSIC_MODE_CHANGED", "AUTO_MODE_TOGGLED", "PLUGIN_STATUS_CHANGED", "QUALITY_CHANGED", "DASHBOARD_TOGGLED", "AGENT_STATUS_CHANGED"]) {
      this.bus.on(event, () => this.queueSave());
    }
    this.bus.on("AGENT_ENABLED", ({ id }) => {
      this.data.agentMemory.recentAgent = id;
      this.data.agentMemory.usage[id] = (this.data.agentMemory.usage[id] ?? 0) + 1;
      this.queueSave();
    });
    this.bus.on("AGENT_SUGGESTION_CREATED", (suggestion) => {
      this.data.agentMemory.suggestionHistory.unshift(suggestion);
      this.data.agentMemory.suggestionHistory = this.data.agentMemory.suggestionHistory.slice(0, 50);
      this.queueSave();
    });
    this.bus.on("AGENT_SUGGESTION_ACCEPTED", (suggestion) => {
      this.data.agentMemory.acceptedSuggestions.unshift(suggestion.id);
      this.queueSave();
    });
    this.bus.on("AGENT_SUGGESTION_DISMISSED", (suggestion) => {
      this.data.agentMemory.dismissedSuggestions.unshift(suggestion.id);
      this.queueSave();
    });
    this.bus.on("AGENT_DISCUSSION_ADDED", (entry) => {
      this.data.multiAgentMemory.discussion.unshift(entry);
      this.data.multiAgentMemory.discussion = this.data.multiAgentMemory.discussion.slice(0, 50);
      this.queueSave();
    });
    this.bus.on("MULTI_AGENT_STATUS_CHANGED", ({ agents = [] } = {}) => {
      for (const agent of agents) {
        this.data.multiAgentMemory.usage[agent.id] = (this.data.multiAgentMemory.usage[agent.id] ?? 0) + (agent.status === "BUSY" ? 1 : 0);
      }
      this.queueSave();
    });
    for (const event of ["AGENT_TASK_CREATED", "AGENT_TASK_ASSIGNED", "AGENT_TASK_STARTED", "AGENT_TASK_COMPLETED", "AGENT_TASK_FAILED", "AGENT_REVIEW_COMPLETED", "AGENT_MEMORY_LOADED"]) {
      this.bus.on(event, (payload = {}) => {
        const task = payload.task ?? {};
        this.data.multiAgentMemory.recentAgent = payload.assignee ?? task.result?.status ?? this.data.multiAgentMemory.recentAgent;
        this.data.multiAgentMemory.taskHistory.unshift({ event, task, at: new Date(this.now()).toISOString() });
        this.data.multiAgentMemory.taskHistory = this.data.multiAgentMemory.taskHistory.slice(0, 50);
        this.data.multiAgentMemory.agentHistory.unshift({ event, agent: payload.assignee ?? "multi-agent-team", at: new Date(this.now()).toISOString() });
        this.data.multiAgentMemory.agentHistory = this.data.multiAgentMemory.agentHistory.slice(0, 50);
        this.queueSave();
      });
    }
  }

  async start() {
    await Promise.resolve();
    const stored = this.storage?.getItem(this.key);
    if (stored) {
      try { this.data = this.normalize(JSON.parse(stored)); } catch { this.data = freshMemory(this.now()); }
    }
    this.data.profile.lastVisit = this.data.profile.lastVisit ?? new Date(this.now()).toISOString();
    this.loaded = true;
    this.bus.emit("MEMORY_LOADED", this.summary());
    await this.restoreLastEnvironment();
    this.updatePreference();
    return this.data;
  }

  normalize(data) {
    const base = freshMemory(this.now());
    return {
      ...base,
      ...data,
      profile: { ...base.profile, ...data?.profile },
      analytics: { ...base.analytics, ...data?.analytics },
      workspaces: { ...base.workspaces, ...data?.workspaces },
      agentMemory: { ...base.agentMemory, ...data?.agentMemory, usage: { ...base.agentMemory.usage, ...data?.agentMemory?.usage } },
      multiAgentMemory: { ...base.multiAgentMemory, ...data?.multiAgentMemory, usage: { ...base.multiAgentMemory.usage, ...data?.multiAgentMemory?.usage } },
    };
  }

  capture() {
    return {
      scene: this.adapters.getScene(),
      sceneName: this.adapters.getSceneName(),
      quality: this.adapters.getQuality(),
      musicPlaying: this.adapters.getMusicPlaying(),
      musicMode: this.adapters.getMusicMode(),
      hudVisible: this.adapters.getHudVisible(),
      dashboardOpen: this.adapters.getDashboardOpen(),
      autoMode: this.adapters.getAutoMode(),
      plugins: this.adapters.getPlugins(),
      agents: this.adapters.getAgents?.() ?? {},
      multiAgents: this.adapters.getMultiAgents?.() ?? {},
      savedAt: new Date(this.now()).toISOString(),
    };
  }

  queueSave() {
    if (!this.loaded || !this.enabled || this.saveQueued) return;
    this.saveQueued = true;
    const version = this.saveVersion;
    queueMicrotask(() => {
      this.saveQueued = false;
      if (version !== this.saveVersion) return;
      this.saveMemory(version);
    });
  }

  async saveMemory(version = this.saveVersion) {
    if (!this.enabled) return false;
    await Promise.resolve();
    if (version !== this.saveVersion) return false;
    return this.flush();
  }

  flush() {
    if (!this.enabled) return false;
    this.recordSceneTime();
    this.data.current = this.capture();
    this.data.updatedAt = this.now();
    this.refreshProfile();
    this.storage?.setItem(this.key, JSON.stringify(this.data));
    this.bus.emit("MEMORY_SAVED", this.summary());
    return true;
  }

  async restoreLastEnvironment() {
    if (!this.enabled || !this.data.current) return false;
    await this.adapters.applyWorkspace(this.data.current, "memory");
    this.bus.emit("WORKSPACE_LOADED", { name: "LAST SESSION", workspace: this.data.current });
    return true;
  }

  async saveWorkspace(name = "Custom Workspace") {
    await Promise.resolve();
    const id = this.workspaceId(name);
    const workspace = { ...this.capture(), name };
    this.data.workspaces[id] = workspace;
    this.data.latestWorkspace = id;
    await this.saveMemory();
    this.bus.emit("WORKSPACE_SAVED", { id, workspace });
    return workspace;
  }

  async loadWorkspace(id = this.data.latestWorkspace) {
    await Promise.resolve();
    const workspace = this.data.workspaces[this.workspaceId(id)] ?? this.data.workspaces[id];
    if (!workspace) return false;
    await this.adapters.applyWorkspace(workspace, "workspace");
    this.data.latestWorkspace = this.workspaceId(id);
    await this.saveMemory();
    this.bus.emit("WORKSPACE_LOADED", { id: this.data.latestWorkspace, workspace });
    return true;
  }

  async clear() {
    await Promise.resolve();
    this.storage?.removeItem(this.key);
    this.saveVersion += 1;
    this.saveQueued = false;
    this.data = freshMemory(this.now());
    this.lastSceneName = this.adapters.getSceneName();
    this.sceneEnteredAt = this.now();
    this.bus.emit("MEMORY_CLEARED", this.summary());
    this.updatePreference();
    return true;
  }

  export() {
    this.recordSceneTime();
    this.data.current = this.capture();
    this.refreshProfile();
    return JSON.stringify(this.data, null, 2);
  }

  async import(serialized) {
    await Promise.resolve();
    this.data = this.normalize(typeof serialized === "string" ? JSON.parse(serialized) : serialized);
    await this.saveMemory();
    this.bus.emit("MEMORY_LOADED", this.summary());
    return this.data;
  }

  setEnabled(enabled) {
    this.enabled = enabled;
    if (enabled) this.queueSave();
  }

  recordSceneTime() {
    if (!this.loaded) return;
    const elapsed = Math.max(0, this.now() - this.sceneEnteredAt);
    this.data.analytics[this.lastSceneName] = (this.data.analytics[this.lastSceneName] ?? 0) + elapsed;
    this.sceneEnteredAt = this.now();
  }

  refreshProfile() {
    const ranking = this.ranking();
    const profile = this.data.profile;
    profile.mostUsedScene = ranking[0]?.name ?? this.adapters.getSceneName();
    profile.favoriteScene = profile.mostUsedScene;
    profile.favoriteQuality = this.adapters.getQuality();
    profile.favoriteInteraction = this.adapters.getInteraction();
    profile.totalUsageTime = Object.values(this.data.analytics).reduce((total, value) => total + value, 0);
    profile.lastVisit = new Date(this.now()).toISOString();
    this.updatePreference();
  }

  ranking() {
    return Object.entries(this.data.analytics)
      .map(([name, duration]) => ({ name, duration }))
      .sort((a, b) => b.duration - a.duration);
  }

  updatePreference() {
    this.adapters.updatePreference?.(this.data.profile, this.data.workspaces);
  }

  summary() {
    return {
      profile: { ...this.data.profile },
      ranking: this.ranking(),
      lastScene: this.data.current?.sceneName ?? this.adapters.getSceneName(),
      savedWorkspaces: Object.keys(this.data.workspaces).length,
      recommendation: this.adapters.getRecommendation?.() ?? null,
      agentMemory: structuredClone(this.data.agentMemory),
      multiAgentMemory: structuredClone(this.data.multiAgentMemory),
      lastWorkspace: this.data.latestWorkspace,
      workspaces: structuredClone(this.data.workspaces),
    };
  }

  workspaceId(name = "") {
    return String(name).trim().toLowerCase().replace(/\s+workspace$/, "").replace(/\s+/g, "-");
  }
}

export { DEFAULT_PROFILE, DEFAULT_WORKSPACES, STORAGE_KEY, WORLD_NAMES };
