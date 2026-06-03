export function createPlugin(metadata, bus) {
  let status = "DISABLED";
  let initialized = false;
  let error = null;
  const resources = new Set();
  return {
    init() {
      if (initialized) return;
      status = "LOADING";
      initialized = true;
      bus.emit("plugin:init", { id: metadata.id });
      status = "DISABLED";
    },
    enable() {
      if (status === "ENABLED") return;
      status = "ENABLED";
      error = null;
      bus.emit("plugin:enabled", { id: metadata.id });
    },
    disable() {
      if (status === "DISABLED") return;
      for (const release of resources) release();
      resources.clear();
      status = "DISABLED";
      bus.emit("plugin:disabled", { id: metadata.id });
    },
    destroy() {
      this.disable();
      initialized = false;
      bus.emit("plugin:destroyed", { id: metadata.id });
    },
    getStatus() { return status; },
    getMetadata() { return metadata; },
    getError() { return error; },
    setError(nextError) { error = nextError; status = "ERROR"; },
    track(release) { resources.add(release); },
  };
}
