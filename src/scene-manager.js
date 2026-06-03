import { WORLD_PRESETS } from "./particle-presets.js";

export class SceneManager {
  constructor(bus, engine, transitions) {
    this.bus = bus;
    this.engine = engine;
    this.transitions = transitions;
    this.index = 0;
    this.lastGestureNavigation = -Infinity;
    this.router = null;
    this.bus.on("GESTURE_CHANGED", (gesture) => this.handleGesture(gesture));
  }

  current() {
    return WORLD_PRESETS[this.index];
  }

  activate(index, source = "user") {
    this.index = (index + WORLD_PRESETS.length) % WORLD_PRESETS.length;
    const preset = this.current();
    this.transitions.start();
    this.engine.configure(preset, this.engine.quality);
    document.documentElement.style.setProperty("--accent", preset.accent);
    this.bus.emit("scene:changed", { index: this.index, preset, source });
    if (source === "user") this.bus.emit("USER_SCENE_OVERRIDE", { index: this.index, preset });
  }

  next() {
    this.activate(this.index + 1);
  }

  previous() {
    this.activate(this.index - 1);
  }

  handleGesture({ type }) {
    const now = performance.now();
    if (now - this.lastGestureNavigation < 800) return;
    if (type === "SWIPE_LEFT") this.router ? this.router.dispatch("previousScene", {}, "gesture") : this.previous();
    else if (type === "SWIPE_RIGHT") this.router ? this.router.dispatch("nextScene", {}, "gesture") : this.next();
    else return;
    this.lastGestureNavigation = now;
  }
}
