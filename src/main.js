import "./style.css";
import { EventBus } from "./event-bus.js";
import { ParticleEngine } from "./particle-engine.js";
import { ParticleController } from "./particle-controller.js";
import { SceneManager } from "./scene-manager.js";
import { TransitionManager } from "./transition-manager.js";
import { ShockwaveEffect } from "./shockwave-effect.js";
import { PerformanceManager, QUALITY_LEVELS } from "./performance-manager.js";
import { WORLD_PRESETS } from "./particle-presets.js";
import { CameraLayer } from "./camera-layer.js";
import { GestureEngine } from "./gesture-engine.js";
import { Hud } from "./hud.js";
import { AudioAnalyzer } from "./audio-analyzer.js";
import { MusicController } from "./music-controller.js";
import { MusicEffects } from "./music-effects.js";
import { ContextEngine } from "./context-engine.js";
import { CommandRouter } from "./command-router.js";
import { VoiceCommander } from "./voice-commander.js";
import { SystemHealth } from "./system-health.js";
import { UltimateDashboard } from "./ultimate-dashboard.js";
import { PluginManager } from "./plugin-manager.js";
import { PluginCenter } from "./plugin-center.js";
import { DEFAULT_PLUGIN_FACTORIES } from "./plugins/index.js";
import createWorkspaceMemoryPlugin from "./plugins/workspace-memory-plugin/index.js";
import { WorkspaceMemory } from "./workspace-memory.js";
import { PreferenceEngine } from "./preference-engine.js";
import { AgentManager } from "./agent-manager.js";
import { AgentLayer } from "./agent-layer.js";
import { AgentCenter } from "./agent-center.js";
import createAgentPlugin from "./plugins/agent-plugin/index.js";
import { MultiAgentManager } from "./multi-agent-manager.js";
import { TaskBoard } from "./task-board.js";
import { CommandCenter } from "./command-center.js";
import { MissionControl } from "./mission-control.js";

const bus = new EventBus();
const router = new CommandRouter(bus);
const commandCenter = new CommandCenter(bus, router);
const shockwaves = new ShockwaveEffect();
const transitions = new TransitionManager();
const engine = new ParticleEngine(document.getElementById("universe"), shockwaves, transitions);
const sceneManager = new SceneManager(bus, engine, transitions);
const performance = new PerformanceManager((quality) => {
  engine.configure(sceneManager.current(), QUALITY_LEVELS[quality]);
  renderQualityOptions();
  bus.emit("QUALITY_CHANGED", { quality });
});
const cameraLayer = new CameraLayer(bus, document.getElementById("camera-video"), document.getElementById("camera-preview"));
const gestureEngine = new GestureEngine(bus, () => performance.fps);
new Hud(bus);
const controller = new ParticleController(bus, engine, sceneManager, cameraLayer, commandCenter);
const audioAnalyzer = new AudioAnalyzer(bus, () => performance.fps);
const musicController = new MusicController(
  bus,
  audioAnalyzer,
  document.getElementById("music-audio"),
  document.getElementById("music-file"),
  document.getElementById("music-panel"),
  router,
);
new MusicEffects(bus, engine, sceneManager);
const contextEngine = new ContextEngine(bus, sceneManager, performance);
const dashboard = new UltimateDashboard(bus, document.getElementById("ultimate-dashboard"));
const systemHealth = new SystemHealth(bus);
const voiceCommander = new VoiceCommander(bus, commandCenter);
const pluginManager = new PluginManager(bus);
const pluginCenter = new PluginCenter(bus, pluginManager, document.getElementById("plugin-center"));
const preferenceEngine = new PreferenceEngine(bus);
const agentManager = new AgentManager(bus);
const agentLayer = new AgentLayer(bus, agentManager);
const agentCenter = new AgentCenter(bus, agentManager, document.getElementById("agent-center"));
let workspaceMemory;
const multiAgentManager = new MultiAgentManager(bus, {
  readMemory: () => ({ ...(workspaceMemory?.summary?.() ?? {}), currentContext: contextEngine.context }),
  activateLegacyAgent: (id) => agentManager.enable(id, "multi-agent-context"),
});
const taskBoard = new TaskBoard(bus, multiAgentManager, document.getElementById("multi-agent-center"));
const missionControl = new MissionControl(bus, commandCenter, document.getElementById("mission-control"), {
  getWorlds: () => WORLD_PRESETS,
  getScene: () => ({ index: sceneManager.index, name: sceneManager.current().name }),
  getAgents: () => agentManager.list(),
  getTeam: () => multiAgentManager.summary(),
  getPlugins: () => pluginManager.list(),
  getWorkspaces: () => workspaceMemory?.summary?.().workspaces ?? {},
  getMemory: () => workspaceMemory?.summary?.() ?? {},
  getHealth: () => systemHealth.lastHealth ?? { health: "OK", issues: [] },
  getPerformance: () => ({ fps: performance.fps, quality: performance.quality, particles: engine.particles.length }),
  getSystems: () => ({
    music: musicController.audio.paused ? "OFF" : "PLAYING",
    camera: cameraLayer.stream ? "ONLINE" : "OFF",
    gesture: document.getElementById("gesture-status")?.textContent ?? "READY",
    voice: document.getElementById("voice-state")?.textContent ?? "OFF",
    context: contextEngine.context || "ANALYZING",
  }),
});
const commandHelp = document.getElementById("command-help");
const setCommandHelpOpen = (open) => {
  commandHelp.classList.toggle("open", Boolean(open));
  bus.emit("COMMAND_HELP_TOGGLED", { open: Boolean(open) });
};
let preferenceRecommendation = null;
workspaceMemory = new WorkspaceMemory(bus, {
  getScene: () => sceneManager.index,
  getSceneName: () => sceneManager.current().name,
  getQuality: () => performance.quality,
  getMusicPlaying: () => !musicController.audio.paused,
  getMusicMode: () => musicController.mode,
  getHudVisible: () => !document.body.classList.contains("hud-hidden"),
  getDashboardOpen: () => dashboard.open,
  getAutoMode: () => contextEngine.autoMode,
  getPlugins: () => Object.fromEntries(pluginManager.list().map(({ id, status }) => [id, status])),
  getAgents: () => Object.fromEntries(agentManager.list().map(({ id, status }) => [id, status])),
  getMultiAgents: () => Object.fromEntries(multiAgentManager.list().map(({ id, status }) => [id, status])),
  getInteraction: () => sceneManager.current().interaction,
  getRecommendation: () => preferenceRecommendation,
  updatePreference: (profile, workspaces) => { preferenceRecommendation = preferenceEngine.recommend(profile, workspaces); },
  applyWorkspace: async (workspace) => {
    if (Number.isInteger(workspace.scene)) sceneManager.activate(workspace.scene, "memory");
    if (workspace.quality) performance.setQuality(workspace.quality);
    if (typeof workspace.musicMode === "boolean") musicController.setMode(workspace.musicMode);
    if (typeof workspace.hudVisible === "boolean") document.body.classList.toggle("hud-hidden", !workspace.hudVisible);
    if (typeof workspace.dashboardOpen === "boolean") dashboard.setOpen(workspace.dashboardOpen);
    if (typeof workspace.autoMode === "boolean") contextEngine.setAutoMode(workspace.autoMode);
    const pluginStates = Object.entries(workspace.plugins ?? {}).sort(([id]) => id === "workspace-memory-plugin" ? 1 : -1);
    for (const [id, status] of pluginStates) {
      if (status === "ENABLED") pluginManager.enable(id);
      else if (status === "DISABLED") pluginManager.disable(id);
    }
    for (const [id, status] of Object.entries(workspace.agents ?? {})) {
      if (status === "ACTIVE") agentManager.enable(id, "memory");
      else if (status === "DISABLED") agentManager.disable(id, "memory");
    }
    if (workspace.musicPlaying) {
      musicController.playCurrent().catch(() => bus.emit("MEMORY_RESTORE_NOTICE", { message: "Music restore requires user playback permission" }));
    }
  },
});
sceneManager.router = commandCenter;
const qualityNames = Object.keys(QUALITY_LEVELS);
const setRelativeQuality = (direction) => {
  const index = qualityNames.indexOf(performance.quality);
  performance.setQuality(qualityNames[Math.max(0, Math.min(qualityNames.length - 1, index + direction))]);
};
commandCenter
  .register("switchScene", ({ index }) => sceneManager.activate(index))
  .register("nextScene", () => sceneManager.next())
  .register("previousScene", () => sceneManager.previous())
  .register("triggerBurst", ({ x, y }) => controller.triggerBurst(x, y))
  .register("resetScene", () => controller.resetScene())
  .register("toggleMusic", () => musicController.togglePlayback())
  .register("playMusic", () => { if (musicController.audio.paused) musicController.togglePlayback(); })
  .register("pauseMusic", () => { if (!musicController.audio.paused) musicController.togglePlayback(); })
  .register("toggleMusicMode", () => musicController.toggleMode())
  .register("toggleCamera", () => cameraLayer.toggle())
  .register("toggleAutoMode", () => contextEngine.toggleAuto())
  .register("setAutoMode", ({ enabled }) => contextEngine.setAutoMode(enabled))
  .register("setQuality", ({ quality }) => performance.setQuality(quality))
  .register("adjustQuality", ({ direction }) => setRelativeQuality(direction))
  .register("toggleDashboard", () => dashboard.toggle())
  .register("openDashboard", () => dashboard.setOpen(true))
  .register("closeDashboard", () => dashboard.setOpen(false))
  .register("toggleVoice", () => voiceCommander.toggle())
  .register("togglePluginCenter", () => pluginCenter.toggle())
  .register("openPluginCenter", () => pluginCenter.show())
  .register("openPluginSearch", () => pluginCenter.show(true))
  .register("saveWorkspace", ({ name } = {}) => workspaceMemory.saveWorkspace(name || document.getElementById("workspace-name").value || "Custom Workspace"))
  .register("loadWorkspace", ({ id } = {}) => workspaceMemory.loadWorkspace(id))
  .register("clearMemory", () => workspaceMemory.clear())
  .register("openAgent", ({ id }) => agentLayer.open(id))
  .register("closeAllAgents", () => agentLayer.closeAll())
  .register("collectAgentSuggestions", () => agentLayer.today())
  .register("createMultiAgentTask", ({ title } = {}) => multiAgentManager.createTask(title || document.getElementById("multi-agent-task-input")?.value || "Collaborative workspace review", "command"))
  .register("startCollaboration", () => multiAgentManager.startCollaboration())
  .register("stopCollaboration", () => multiAgentManager.stopCollaboration())
  .register("showTaskBoard", () => {
    dashboard.setOpen(true);
    taskBoard.setOpen(true);
    multiAgentManager.showTaskBoard();
  })
  .register("showAgentStatus", () => {
    dashboard.setOpen(true);
    taskBoard.setOpen(true);
    multiAgentManager.showTaskBoard();
  })
  .register("toggleMissionControl", () => missionControl.toggle())
  .register("openMissionControl", () => missionControl.setOpen(true))
  .register("closeMissionControl", () => missionControl.setOpen(false))
  .register("showCommandHelp", () => setCommandHelpOpen(true))
  .register("hideCommandHelp", () => setCommandHelpOpen(false))
  .register("toggleCommandHelp", () => setCommandHelpOpen(!commandHelp.classList.contains("open")));
commandCenter.register("applyGesture", ({ gesture }) => engine.applyGesture(gesture));
bus.on("CAMERA_STARTED", ({ video }) => gestureEngine.start(video));
bus.on("CAMERA_STOPPED", () => gestureEngine.stop());
bus.on("CAMERA_ERROR", () => {
  cameraLayer.fail();
  gestureEngine.stop();
});
bus.on("AUDIO_ANALYSIS", (analysis) => {
  for (const metric of ["volume", "bass", "mid", "treble", "energy"]) {
    const value = analysis[metric];
    document.getElementById(`music-${metric}`).textContent = value.toFixed(2);
    document.getElementById(`music-${metric}-bar`).style.width = `${value * 100}%`;
  }
  document.getElementById("music-beat").textContent = analysis.beat ? "PULSE" : "READY";
  document.getElementById("music-beat-bar").style.width = analysis.beat ? "100%" : "0%";
});
bus.on("MUSIC_TRACK_CHANGED", ({ name }) => { document.getElementById("music-name").textContent = name; });
bus.on("MUSIC_STATE_CHANGED", ({ status, name }) => {
  document.getElementById("music-name").textContent = name;
  document.getElementById("music-state").textContent = status;
  document.getElementById("music-play").textContent = status === "PLAYING" ? "PAUSE" : "PLAY";
});
bus.on("AUDIO_ERROR", ({ state }) => { document.getElementById("music-state").textContent = state; });
bus.on("MUSIC_MODE_CHANGED", ({ enabled }) => {
  document.getElementById("music-mode-state").textContent = enabled ? "ON" : "OFF";
  document.getElementById("music-mode").classList.toggle("online", enabled);
});
bus.on("CONTEXT_MUSIC_MODE_REQUESTED", () => musicController.setMode(true));
bus.on("CONTEXT_RECOMMENDATION", ({ context, recommendedWorld, confidence, autoMode, lastSwitch }) => {
  document.getElementById("context-name").textContent = context;
  document.getElementById("context-world").textContent = recommendedWorld;
  document.getElementById("context-confidence").textContent = confidence.toFixed(2);
  document.getElementById("context-last-switch").textContent = lastSwitch ? new Date(lastSwitch).toLocaleTimeString([], { hour12: false }) : "NEVER";
  document.getElementById("context-status").textContent = autoMode ? "AUTO MODE" : "SUGGEST MODE";
  document.getElementById("context-study").classList.toggle("active", context === "STUDY");
  document.getElementById("context-coding").classList.toggle("active", context === "CODING");
});
bus.on("AUTO_MODE_TOGGLED", ({ enabled }) => {
  document.getElementById("context-auto-state").textContent = enabled ? "ON" : "OFF";
  document.getElementById("context-auto").classList.toggle("online", enabled);
});
bus.on("VOICE_STATE_CHANGED", ({ state, listening, enabled }) => {
  document.getElementById("voice-state").textContent = state;
  document.getElementById("voice-listening").textContent = listening ? "YES" : "NO";
  document.getElementById("voice-toggle").classList.toggle("online", enabled);
});
bus.on("VOICE_COMMAND", ({ text, confidence, action }) => {
  document.getElementById("voice-command").textContent = action;
  document.getElementById("voice-text").textContent = text;
  document.getElementById("voice-action").textContent = action;
  document.getElementById("voice-confidence").textContent = confidence.toFixed(2);
});
bus.on("VOICE_ERROR", ({ state }) => { document.getElementById("voice-action").textContent = state; });
bus.on("PLUGIN_ERROR", () => { elements.effect.textContent = "PLUGIN ERROR"; });
bus.on("AGENT_ACTION_REQUESTED", ({ action }) => {
  if (action === "save_workspace") commandCenter.dispatch("saveWorkspace", {}, "agent");
  if (action === "load_study_workspace") commandCenter.dispatch("loadWorkspace", { id: "study" }, "agent");
  if (action === "check_plugin_status") commandCenter.dispatch("openPluginCenter", {}, "agent");
});

const elements = {
  worldNumber: document.getElementById("world-number"),
  worldName: document.getElementById("world-name"),
  worldDescription: document.getElementById("world-description"),
  fps: document.getElementById("fps"),
  particleCount: document.getElementById("particle-count"),
  quality: document.getElementById("quality"),
  effect: document.getElementById("effect"),
  dots: document.getElementById("world-dots"),
  qualityOptions: document.getElementById("quality-options"),
};

function renderDots() {
  elements.dots.replaceChildren(...WORLD_PRESETS.map((preset, index) => {
    const button = document.createElement("button");
    button.className = index === sceneManager.index ? "world-dot active" : "world-dot";
    button.ariaLabel = `Open ${preset.name}`;
    button.addEventListener("click", () => commandCenter.dispatch("switchScene", { index }, "button"));
    return button;
  }));
}

function renderQualityOptions() {
  elements.qualityOptions.replaceChildren(...Object.keys(QUALITY_LEVELS).map((quality) => {
    const button = document.createElement("button");
    button.textContent = quality;
    button.className = quality === performance.quality ? "active" : "";
    button.addEventListener("click", () => commandCenter.dispatch("setQuality", { quality }, "button"));
    return button;
  }));
  elements.quality.textContent = performance.quality;
}

bus.on("scene:changed", ({ index, preset }) => {
  elements.worldNumber.textContent = String(index + 1).padStart(2, "0");
  elements.worldName.textContent = preset.name;
  elements.worldDescription.textContent = preset.description;
  if (!engine.musicMode) elements.effect.textContent = preset.interaction;
  renderDots();
});
bus.on("effect:changed", (effect) => { elements.effect.textContent = effect; });
document.getElementById("previous").addEventListener("click", () => commandCenter.dispatch("previousScene", {}, "button"));
document.getElementById("next").addEventListener("click", () => commandCenter.dispatch("nextScene", {}, "button"));
document.getElementById("context-auto").addEventListener("click", () => commandCenter.dispatch("toggleAutoMode", {}, "button"));
document.getElementById("context-study").addEventListener("click", () => contextEngine.setIntent("STUDY"));
document.getElementById("context-coding").addEventListener("click", () => contextEngine.setIntent("CODING"));
document.getElementById("context-accept").addEventListener("click", () => contextEngine.acceptRecommendation());
commandCenter.bindKeyboard((event, center) => {
  if (event.repeat) return;
  if (event.key === "Escape" && missionControl.open) {
    event.preventDefault();
    center.dispatch("closeMissionControl", {}, "keyboard");
    return;
  }
  if (event.key === "Escape" && commandHelp.classList.contains("open")) {
    event.preventDefault();
    center.dispatch("hideCommandHelp", {}, "keyboard");
    return;
  }
  if (event.key === "Tab") {
    event.preventDefault();
    center.dispatch("toggleMissionControl", {}, "keyboard");
    return;
  }
  if (event.key === "Escape" && pluginCenter.open) pluginCenter.hide();
  if (event.ctrlKey && event.shiftKey && (event.key === "r" || event.key === "R")) {
    event.preventDefault();
    center.dispatch("clearMemory", {}, "keyboard");
    return;
  }
  if (event.ctrlKey && !event.shiftKey && (event.key === "s" || event.key === "S")) {
    event.preventDefault();
    center.dispatch("saveWorkspace", {}, "keyboard");
    return;
  }
  if (event.ctrlKey && !event.shiftKey && (event.key === "l" || event.key === "L")) {
    event.preventDefault();
    center.dispatch("loadWorkspace", {}, "keyboard");
    return;
  }
  if (["INPUT", "TEXTAREA"].includes(event.target?.tagName)) return;
  if (event.key === "a" || event.key === "A") {
    if (event.shiftKey) contextEngine.acceptRecommendation();
    else center.dispatch("toggleAutoMode", {}, "keyboard");
  }
  if (event.key === "d" || event.key === "D") center.dispatch("toggleDashboard", {}, "keyboard");
  if (event.key === "v" || event.key === "V") center.dispatch("toggleVoice", {}, "keyboard");
  if (event.key === "p" || event.key === "P") {
    event.preventDefault();
    center.dispatch(event.ctrlKey && event.shiftKey ? "openPluginSearch" : "togglePluginCenter", {}, "keyboard");
  }
  if (event.key === "?") {
    event.preventDefault();
    center.dispatch("toggleCommandHelp", {}, "keyboard");
  }
  if (event.key === "q" || event.key === "Q") center.dispatch("adjustQuality", { direction: -1 }, "keyboard");
  if (event.key === "e" || event.key === "E") center.dispatch("adjustQuality", { direction: 1 }, "keyboard");
});
document.getElementById("voice-toggle").addEventListener("click", () => commandCenter.dispatch("toggleVoice", {}, "button"));
document.getElementById("dashboard-toggle").addEventListener("click", () => commandCenter.dispatch("toggleDashboard", {}, "button"));
document.getElementById("plugin-center-open").addEventListener("click", () => commandCenter.dispatch("openPluginCenter", {}, "button"));
document.getElementById("plugin-center-close").addEventListener("click", () => pluginCenter.hide());
document.getElementById("command-help-toggle").addEventListener("click", () => commandCenter.dispatch("toggleCommandHelp", {}, "button"));
document.getElementById("command-help-close").addEventListener("click", () => commandCenter.dispatch("hideCommandHelp", {}, "button"));
document.getElementById("workspace-save").addEventListener("click", () => commandCenter.dispatch("saveWorkspace", {}, "button"));
document.getElementById("workspace-load").addEventListener("click", () => commandCenter.dispatch("loadWorkspace", {}, "button"));
document.getElementById("memory-clear").addEventListener("click", () => commandCenter.dispatch("clearMemory", {}, "button"));
document.getElementById("agents-close-all").addEventListener("click", () => commandCenter.dispatch("closeAllAgents", {}, "button"));
for (const button of document.querySelectorAll("[data-workspace]")) {
  button.addEventListener("click", () => commandCenter.dispatch("loadWorkspace", { id: button.dataset.workspace }, "button"));
}
window.addEventListener("beforeunload", () => { workspaceMemory.flush(); });
for (const event of ["pointermove", "pointerdown", "wheel", "touchstart"]) {
  window.addEventListener(event, () => contextEngine.markActivity(), { passive: true });
}

controller.bind();
musicController.bind();
for (const createPlugin of DEFAULT_PLUGIN_FACTORIES) pluginManager.register(createPlugin(bus));
pluginManager.register(createWorkspaceMemoryPlugin(bus, workspaceMemory));
pluginManager.register(createAgentPlugin(bus, agentManager));
for (const plugin of pluginManager.list()) {
  if (plugin.autoEnable) pluginManager.enable(plugin.id);
}
pluginCenter.render();
agentCenter.render();
renderQualityOptions();
sceneManager.activate(0, "system");
contextEngine.start();
workspaceMemory.start().catch((error) => bus.emit("MEMORY_ERROR", { error, message: error.message }));
dashboard.start();
systemHealth.registerAnimationLoop();
systemHealth.start();
voiceCommander.emitState();

let previous = window.performance.now();
function frame(now) {
  const delta = Math.min(50, now - previous);
  previous = now;
  transitions.update(delta);
  shockwaves.update(delta);
  engine.effectScale = performance.effectScale;
  engine.update(delta);
  engine.draw();
  if (performance.update(delta)) {
    elements.fps.textContent = performance.fps;
    elements.particleCount.textContent = engine.particles.length.toLocaleString();
    elements.quality.textContent = performance.quality;
    contextEngine.updateFps(performance.fps);
    dashboard.updateMetrics({ fps: performance.fps, quality: performance.quality, particles: engine.particles.length.toLocaleString() });
    systemHealth.recordFrame(performance.fps);
    systemHealth.setDuplicateListeners(bus.diagnostics().duplicateListeners);
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
