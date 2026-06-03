import createScenePlugin from "./scene-plugin/index.js";
import createMusicPlugin from "./music-plugin/index.js";
import createCameraPlugin from "./camera-plugin/index.js";
import createGesturePlugin from "./gesture-plugin/index.js";
import createVoicePlugin from "./voice-plugin/index.js";
import createDashboardPlugin from "./dashboard-plugin/index.js";
import createContextPlugin from "./context-plugin/index.js";
import createPerformancePlugin from "./performance-plugin/index.js";
import createKeyboardPlugin from "./keyboard-plugin/index.js";
import createEffectsPlugin from "./effects-plugin/index.js";

export const DEFAULT_PLUGIN_FACTORIES = [
  createScenePlugin,
  createMusicPlugin,
  createCameraPlugin,
  createGesturePlugin,
  createVoicePlugin,
  createDashboardPlugin,
  createContextPlugin,
  createPerformancePlugin,
  createKeyboardPlugin,
  createEffectsPlugin,
];
