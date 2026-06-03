import { createPlugin } from "../plugin-factory.js";

export const metadata = {
  id: "agent-plugin",
  name: "Agent Plugin",
  version: "1.0.0",
  description: "Controls the local AI Agent Layer and pauses all agents when disabled.",
  dependencies: ["context-plugin", "workspace-memory-plugin", "dashboard-plugin"],
  autoEnable: true,
};

export default function createAgentPlugin(bus, manager) {
  const plugin = createPlugin(metadata, bus);
  return {
    ...plugin,
    enable() { plugin.enable(); manager.setEnabled(true); },
    disable() { manager.setEnabled(false); plugin.disable(); },
    destroy() { manager.setEnabled(false); plugin.destroy(); },
    getAgentStatus() { return manager.summary(); },
  };
}
