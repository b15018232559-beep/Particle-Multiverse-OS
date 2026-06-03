import { createTeamAgent } from "./team-agent-factory.js";

function buildSteps(title) {
  const text = title.toLowerCase();
  if (text.includes("v10") || text.includes("ultimate ai")) {
    return ["UI architecture", "Camera integration", "Voice routing", "Plugin contracts", "Dashboard release audit"];
  }
  if (text.includes("study") || text.includes("学习")) {
    return ["Load study context", "Collect memory summary", "Prioritize review tasks", "Prepare workspace recommendation"];
  }
  if (text.includes("plugin") || text.includes("插件")) {
    return ["Inspect plugin state", "Check enabled plugins", "Plan safe toggle path", "Report plugin health"];
  }
  return ["Clarify task scope", "Read local system state", "Plan execution steps", "Verify result stability", "Summarize final output"];
}

export function createPlannerAgent() {
  return createTeamAgent({
    id: "planner-agent",
    name: "Planner",
    role: "Breaks tasks into executable steps and generates a route.",
  }, ({ task, memory }) => {
    const steps = buildSteps(task.title);
    return {
      route: "Coordinator -> Planner -> Executor -> Reviewer -> Coordinator",
      memoryContext: memory?.favoriteScene ? `favorite scene: ${memory.favoriteScene}` : "memory context unavailable",
      steps,
    };
  });
}
