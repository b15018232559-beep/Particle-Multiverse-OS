export const PLUGIN_STATUS = {
  LOADING: "LOADING",
  ENABLED: "ENABLED",
  DISABLED: "DISABLED",
  ERROR: "ERROR",
};

export class PluginManager {
  constructor(bus) {
    this.bus = bus;
    this.plugins = new Map();
    this.marketplace = {
      enabled: false,
      categories: ["Visual Plugins", "Music Plugins", "Agent Plugins", "Camera Plugins", "Productivity Plugins"],
      install() { throw new Error("Online marketplace is reserved for a future release"); },
    };
  }

  register(plugin) {
    const metadata = plugin.getMetadata();
    if (!metadata?.id) throw new Error("Plugin metadata requires an id");
    if (this.plugins.has(metadata.id)) return false;
    this.validate(plugin);
    this.plugins.set(metadata.id, plugin);
    this.bus.emit("PLUGIN_REGISTERED", { id: metadata.id, metadata, status: plugin.getStatus() });
    this.emitStatus(metadata.id);
    return true;
  }

  enable(id, stack = new Set()) {
    const plugin = this.plugins.get(id);
    if (!plugin) return false;
    if (plugin.getStatus() === PLUGIN_STATUS.ENABLED) return true;
    if (stack.has(id)) return this.fail(id, new Error(`Circular plugin dependency: ${id}`));
    stack.add(id);
    try {
      const metadata = plugin.getMetadata();
      for (const dependency of metadata.dependencies ?? []) {
        if (!this.plugins.has(dependency)) throw new Error(`Missing dependency: ${dependency}`);
        if (!this.enable(dependency, stack)) throw new Error(`Dependency unavailable: ${dependency}`);
      }
      plugin.init();
      plugin.enable();
      this.bus.emit("PLUGIN_ENABLED", { id, metadata, status: plugin.getStatus() });
      this.emitStatus(id);
      return true;
    } catch (error) {
      return this.fail(id, error);
    } finally {
      stack.delete(id);
    }
  }

  disable(id) {
    const plugin = this.plugins.get(id);
    if (!plugin) return false;
    if (plugin.getStatus() === PLUGIN_STATUS.DISABLED) return true;
    try {
      for (const dependent of this.list()) {
        if (dependent.status === PLUGIN_STATUS.ENABLED && dependent.dependencies?.includes(id)) {
          this.disable(dependent.id);
        }
      }
      plugin.disable();
      this.bus.emit("PLUGIN_DISABLED", { id, metadata: plugin.getMetadata(), status: plugin.getStatus() });
      this.emitStatus(id);
      return true;
    } catch (error) {
      return this.fail(id, error);
    }
  }

  destroy(id) {
    const plugin = this.plugins.get(id);
    if (!plugin) return false;
    try {
      plugin.destroy();
      this.emitStatus(id);
      return true;
    } catch (error) {
      return this.fail(id, error);
    }
  }

  toggle(id) {
    return this.getStatus(id) === PLUGIN_STATUS.ENABLED ? this.disable(id) : this.enable(id);
  }

  getStatus(id) {
    return this.plugins.get(id)?.getStatus() ?? null;
  }

  getPlugin(id) {
    return this.plugins.get(id) ?? null;
  }

  list() {
    return [...this.plugins.values()].map((plugin) => ({
      ...plugin.getMetadata(),
      status: plugin.getStatus(),
      error: plugin.getError?.() ?? null,
    }));
  }

  summary() {
    const plugins = this.list();
    const count = (status) => plugins.filter((plugin) => plugin.status === status).length;
    return {
      total: plugins.length,
      enabled: count(PLUGIN_STATUS.ENABLED),
      disabled: count(PLUGIN_STATUS.DISABLED),
      errors: count(PLUGIN_STATUS.ERROR),
      plugins,
    };
  }

  validate(plugin) {
    for (const method of ["init", "enable", "disable", "destroy", "getStatus", "getMetadata"]) {
      if (typeof plugin[method] !== "function") throw new Error(`Plugin lifecycle missing: ${method}`);
    }
  }

  fail(id, error) {
    const plugin = this.plugins.get(id);
    try { plugin?.setError?.(error); } catch {}
    try { plugin?.disable?.(); } catch {}
    try { plugin?.setError?.(error); } catch {}
    this.bus.emit("PLUGIN_ERROR", { id, error, message: error.message, status: PLUGIN_STATUS.ERROR });
    this.emitStatus(id);
    return false;
  }

  emitStatus(id) {
    this.bus.emit("PLUGIN_STATUS_CHANGED", { id, summary: this.summary(), status: this.getStatus(id) });
  }
}
