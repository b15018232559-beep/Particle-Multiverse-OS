export class EventBus {
  constructor() {
    this.listeners = new Map();
    this.duplicateAttempts = 0;
  }

  on(event, callback) {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    if (this.listeners.get(event).has(callback)) this.duplicateAttempts += 1;
    this.listeners.get(event).add(callback);
    return () => this.listeners.get(event)?.delete(callback);
  }

  emit(event, payload) {
    if (event === "GESTURE_CHANGED") console.info("Event Bus emitted: GESTURE_CHANGED");
    this.listeners.get(event)?.forEach((callback) => callback(payload));
    if (event === "GESTURE_CHANGED" && payload?.type !== "NONE" && !payload?.applied) {
      console.warn("Particle controller did not receive GESTURE_CHANGED");
    }
  }

  diagnostics() {
    return { duplicateListeners: this.duplicateAttempts, events: this.listeners.size };
  }
}
