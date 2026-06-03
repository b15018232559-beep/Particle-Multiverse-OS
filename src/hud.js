export class Hud {
  constructor(bus) {
    this.camera = document.getElementById("camera-status");
    this.hand = document.getElementById("hand-status");
    this.gesture = document.getElementById("gesture-status");
    this.confidence = document.getElementById("gesture-confidence");
    this.control = document.getElementById("control-status");
    this.advanced = document.getElementById("advanced-status");
    this.fallback = document.getElementById("fallback-status");
    this.toggle = document.getElementById("camera-toggle");
    this.lastVoice = document.getElementById("last-voice-command");
    this.lastGesture = document.getElementById("last-gesture");
    this.commandResult = document.getElementById("command-result");
    this.commandConfidence = document.getElementById("command-confidence");
    this.commandAction = document.getElementById("command-action");

    bus.on("CAMERA_STARTED", () => this.setCamera("ONLINE"));
    bus.on("CAMERA_STOPPED", () => this.setCamera("OFF"));
    bus.on("CAMERA_ERROR", ({ state }) => this.setCamera(state));
    bus.on("HAND_DETECTED", () => {
      this.hand.textContent = "DETECTED";
      this.hand.classList.add("online");
    });
    bus.on("HAND_LOST", () => this.resetHand());
    bus.on("GESTURE_CHANGED", ({ type, confidence }) => {
      this.gesture.textContent = type;
      this.confidence.textContent = confidence.toFixed(2);
      this.advanced.textContent = type === "NONE" ? "READY" : "ACTIVE";
      this.lastGesture.textContent = type;
      this.commandConfidence.textContent = confidence.toFixed(2);
      this.commandAction.textContent = this.gestureAction(type);
    });
    bus.on("VOICE_COMMAND", ({ text, confidence = 0, action, result, status }) => {
      this.lastVoice.textContent = text || "NONE";
      this.commandResult.textContent = result || action || "READY";
      this.commandConfidence.textContent = confidence.toFixed(2);
      this.commandAction.textContent = status === "SUCCESS" ? action : (result || status || "未识别命令");
    });
    bus.on("VOICE_ERROR", ({ state }) => {
      this.commandResult.textContent = state;
      this.commandAction.textContent = "VOICE_ERROR";
    });
  }

  setCamera(state) {
    this.camera.textContent = state;
    const online = state === "ONLINE";
    this.camera.classList.toggle("online", online);
    this.toggle.classList.toggle("online", online);
    this.control.textContent = online ? "CAMERA + MANUAL" : "MANUAL";
    this.fallback.textContent = "MANUAL MODE READY";
    if (!online) this.resetHand();
  }

  resetHand() {
    this.hand.textContent = "LOST";
    this.hand.classList.remove("online");
    this.gesture.textContent = "NONE";
    this.confidence.textContent = "0.00";
    this.advanced.textContent = "READY";
  }

  gestureAction(type) {
    return ({
      OPEN_HAND: "PARTICLE_EXPAND",
      FIST: "PARTICLE_CONVERGE",
      POINT: "PARTICLE_FOLLOW",
      SWIPE_LEFT: "PREVIOUS_PAGE",
      SWIPE_RIGHT: "NEXT_PAGE",
      PINCH: "PARTICLE_FOCUS",
      DOUBLE_OPEN: "WORLD_BURST",
      DOUBLE_FIST: "FOCUS_MODE",
      NONE: "READY",
    })[type] ?? "READY";
  }
}
