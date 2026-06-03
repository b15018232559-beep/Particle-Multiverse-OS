import { createAgent } from "./agent-factory.js";

const metadata = { id: "automation-agent", name: "Automation Agent", description: "Quick tasks, mode switching, workspace snapshots, and plugin health checks." };

export default function createAutomationAgent() {
  return createAgent(metadata, (state) => [{
    message: state.currentContext === "PERFORMANCE_SAVE" ? "Performance is constrained. Check plugin status and keep only essential effects." : "Save a Workspace snapshot and check plugin status.",
    priority: state.currentContext === "PERFORMANCE_SAVE" ? "high" : "medium",
    action: state.currentContext === "PERFORMANCE_SAVE" ? "check_plugin_status" : "save_workspace",
  }]);
}
