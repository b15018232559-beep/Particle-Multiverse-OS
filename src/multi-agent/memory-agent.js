import { createTeamAgent } from "./team-agent-factory.js";

export function createMemoryAgent() {
  return createTeamAgent({
    id: "memory-agent",
    name: "Memory",
    role: "Reads local Workspace Memory, scene history, agent history, and task history.",
  }, ({ readMemory }) => {
    const memory = readMemory?.() ?? {};
    return {
      favoriteScene: memory.profile?.favoriteScene ?? memory.favoriteScene ?? "AI WORLD TREE",
      favoriteWorkspace: memory.lastWorkspace ?? "none",
      usageHistory: memory.ranking ?? [],
      taskHistory: memory.multiAgentMemory?.taskHistory ?? [],
      agentHistory: memory.multiAgentMemory?.agentHistory ?? memory.agentMemory?.suggestionHistory ?? [],
      currentContext: memory.currentContext ?? "UNKNOWN",
    };
  });
}
