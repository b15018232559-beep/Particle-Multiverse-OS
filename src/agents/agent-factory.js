export function createAgent(metadata, suggestionFactory) {
  let status = "DISABLED";
  let initialized = false;
  return {
    init() {
      if (initialized) return;
      initialized = true;
      status = "IDLE";
    },
    enable() {
      if (!initialized) this.init();
      if (status === "ACTIVE") return;
      status = "ACTIVE";
    },
    disable() {
      if (status === "DISABLED") return;
      status = "DISABLED";
    },
    getStatus() { return status; },
    getMetadata() { return metadata; },
    getSuggestions(state) { return suggestionFactory(state); },
    handleEvent(event) {
      if (status === "DISABLED") return [];
      return suggestionFactory({ ...event.state, event: event.type });
    },
    setError() { status = "ERROR"; },
  };
}
