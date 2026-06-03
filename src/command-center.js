import { COMMANDS } from "./command-router.js";

export class CommandCenter {
  constructor(bus, router, options = {}) {
    this.bus = bus;
    this.router = router;
    this.bindings = new Map();
    this.document = options.document ?? globalThis.document;
  }

  register(action, handler) {
    this.router.register(action, (payload = {}, source = "system") => {
      this.bus.emit("COMMAND_CENTER_RECEIVED", { action, payload, source });
      const result = handler(payload, source);
      this.bus.emit("COMMAND_CENTER_COMPLETED", { action, payload, source });
      return result;
    });
    return this;
  }

  dispatch(action, payload = {}, source = "system") {
    const dispatched = this.router.dispatch(action, payload, source);
    this.bus.emit("COMMAND_CENTER_DISPATCHED", { action, payload, source, dispatched });
    return dispatched;
  }

  routeText(text, confidence = 1) {
    this.bus.emit("COMMAND_CENTER_TEXT_RECEIVED", { text, confidence, source: "voice" });
    const match = this.router.matchText?.(text) ?? null;
    const decision = this.router.evaluateVoice?.(text, confidence, match);
    if (decision && !decision.allowed) {
      this.bus.emit("VOICE_COMMAND", decision.event);
      return false;
    }
    if (!match) {
      this.bus.emit("VOICE_COMMAND", { text, confidence, action: "NOT_RECOGNIZED", result: "未识别命令", status: "NOT_RECOGNIZED" });
      return false;
    }
    const dispatched = this.dispatch(match.action, match.payload, "voice");
    this.router.recordVoice?.(match);
    this.bus.emit("VOICE_COMMAND", {
      text,
      confidence,
      action: match.action,
      result: match.result,
      category: match.category,
      status: dispatched ? "SUCCESS" : "NO_HANDLER",
    });
    return dispatched;
  }

  bindButton(id, action, payload = {}, source = "dashboard") {
    const element = this.document.getElementById(id);
    if (!element || this.bindings.has(id)) return false;
    const listener = () => this.dispatch(action, typeof payload === "function" ? payload() : payload, source);
    element.addEventListener("click", listener);
    this.bindings.set(id, { element, listener });
    return true;
  }

  bindWorkspaceButtons(selector = "[data-workspace]") {
    for (const button of this.document.querySelectorAll(selector)) {
      const id = `workspace:${button.dataset.workspace}`;
      if (this.bindings.has(id)) continue;
      const listener = () => this.dispatch("loadWorkspace", { id: button.dataset.workspace }, "dashboard");
      button.addEventListener("click", listener);
      this.bindings.set(id, { element: button, listener });
    }
  }

  bindKeyboard(handler) {
    if (this.bindings.has("keyboard")) return false;
    const listener = (event) => handler(event, this);
    globalThis.window?.addEventListener("keydown", listener);
    this.bindings.set("keyboard", { element: globalThis.window, listener });
    return true;
  }
}
