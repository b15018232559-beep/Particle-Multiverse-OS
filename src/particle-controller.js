export class ParticleController {
  constructor(bus, engine, sceneManager, cameraLayer, router = null) {
    this.bus = bus;
    this.engine = engine;
    this.sceneManager = sceneManager;
    this.cameraLayer = cameraLayer;
    this.router = router;
    this.holdTimer = null;
    this.pointerEngaged = false;
    this.bound = false;
  }

  bind() {
    if (this.bound) return;
    this.bound = true;
    this.bus.on("GESTURE_CHANGED", (gesture) => this.applyGesture(gesture));
    const updatePointer = (event) => this.engine.setPointer(event.clientX, event.clientY);
    window.addEventListener("pointermove", updatePointer, { passive: true });
    window.addEventListener("pointerdown", (event) => {
      if (event.target.closest("button")) return;
      this.pointerEngaged = true;
      updatePointer(event);
      clearTimeout(this.holdTimer);
      this.holdTimer = setTimeout(() => {
        this.engine.setHolding(true);
        this.bus.emit("effect:changed", "CONVERGENCE");
      }, 420);
    });
    window.addEventListener("pointerup", () => {
      if (!this.pointerEngaged) return;
      this.pointerEngaged = false;
      clearTimeout(this.holdTimer);
      this.engine.setHolding(false);
      this.bus.emit("effect:changed", "STABLE");
    });
    window.addEventListener("pointercancel", () => {
      this.pointerEngaged = false;
      clearTimeout(this.holdTimer);
      this.engine.setHolding(false);
      this.bus.emit("effect:changed", "STABLE");
    });
    window.addEventListener("wheel", (event) => {
      this.engine.scroll(event.deltaY);
      this.bus.emit("effect:changed", event.deltaY > 0 ? "EXPANSION" : "ATTRACTION");
    }, { passive: true });
    window.addEventListener("dblclick", (event) => this.route("triggerBurst", { x: event.clientX, y: event.clientY }, "pointer", () => this.triggerBurst(event.clientX, event.clientY)));
    window.addEventListener("keydown", (event) => {
      if (event.code === "Space" || event.key === " ") {
        event.preventDefault();
        this.route("triggerBurst", {}, "keyboard", () => this.triggerBurst());
      }
      if (event.key === "ArrowRight") this.route("nextScene", {}, "keyboard", () => this.sceneManager.next());
      if (event.key === "ArrowLeft") this.route("previousScene", {}, "keyboard", () => this.sceneManager.previous());
      if (event.key === "F11") {
        event.preventDefault();
        this.toggleFullscreen();
      }
      if (event.key === "h" || event.key === "H") this.route("toggleCamera", {}, "keyboard", () => this.cameraLayer.toggle());
      if (event.key === "r" || event.key === "R") {
        this.route("resetScene", {}, "keyboard", () => this.resetScene());
      }
      if (event.key === "Escape") {
        this.cameraLayer.hidePreview();
        if (document.fullscreenElement) document.exitFullscreen();
      }
    });
    window.addEventListener("resize", () => this.engine.resize(), { passive: true });
    document.addEventListener("fullscreenchange", () => {
      document.body.classList.toggle("cinematic-mode", Boolean(document.fullscreenElement));
    });
    document.getElementById("burst").addEventListener("click", () => this.route("triggerBurst", {}, "button", () => this.triggerBurst()));
    document.getElementById("fullscreen").addEventListener("click", () => this.toggleFullscreen());
    document.getElementById("camera-toggle").addEventListener("click", () => this.route("toggleCamera", {}, "button", () => this.cameraLayer.toggle()));
  }

  route(action, payload, source, fallback) {
    if (!this.router?.dispatch(action, payload, source)) fallback();
  }

  triggerBurst(x, y) {
    this.engine.burst(x, y);
    this.bus.emit("effect:changed", "SHOCKWAVE");
    setTimeout(() => this.bus.emit("effect:changed", "STABLE"), 1250);
  }

  resetScene() {
    this.engine.reset();
    this.bus.emit("effect:changed", "RESET");
    setTimeout(() => this.bus.emit("effect:changed", "STABLE"), 700);
  }

  toggleFullscreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen();
      document.body.classList.remove("cinematic-mode");
    } else {
      document.documentElement.requestFullscreen();
      document.body.classList.add("cinematic-mode");
    }
  }

  applyGesture(gesture) {
    if (!this.router?.dispatch("applyGesture", { gesture }, "gesture")) this.engine.applyGesture(gesture);
    gesture.applied = true;
    if (gesture.type === "OPEN_HAND") this.bus.emit("effect:changed", "HAND EXPANSION");
    if (gesture.type === "FIST") this.bus.emit("effect:changed", "HAND CONVERGENCE");
    if (gesture.type === "POINT") this.bus.emit("effect:changed", "HAND FOLLOW");
    if (gesture.type === "SWIPE_LEFT") this.bus.emit("effect:changed", "GESTURE / PREVIOUS");
    if (gesture.type === "SWIPE_RIGHT") this.bus.emit("effect:changed", "GESTURE / NEXT");
    if (gesture.type === "PINCH") this.bus.emit("effect:changed", "PINCH FOCUS");
    if (gesture.type === "DOUBLE_OPEN") this.bus.emit("effect:changed", "MULTIVERSE BURST");
    if (gesture.type === "DOUBLE_FIST") this.bus.emit("effect:changed", "CALM / FOCUS");
    if (gesture.type !== "NONE") console.info("Gesture action applied");
  }
}
