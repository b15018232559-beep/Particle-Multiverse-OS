import { createPlugin } from "../plugin-factory.js";

export const metadata = {
  id: "workspace-memory-plugin",
  name: "Workspace Memory Plugin",
  version: "1.0.0",
  description: "Local-only workspace persistence, analytics, import, and export.",
  dependencies: ["scene-plugin", "performance-plugin", "dashboard-plugin"],
  autoEnable: true,
};

export default function createWorkspaceMemoryPlugin(bus, memory) {
  const plugin = createPlugin(metadata, bus);
  return {
    ...plugin,
    enable() { plugin.enable(); memory.setEnabled(true); },
    disable() { memory.setEnabled(false); plugin.disable(); },
    destroy() { memory.setEnabled(false); plugin.destroy(); },
    export() { return memory.export(); },
    import(serialized) { return memory.import(serialized); },
  };
}
