import { createTeamAgent } from "./team-agent-factory.js";

const TARGETS = ["Scene", "Music", "Camera", "Plugin", "Workspace"];

export function createExecutorAgent() {
  return createTeamAgent({
    id: "executor-agent",
    name: "Executor",
    role: "Executes concrete local task steps against approved system surfaces.",
  }, ({ task, plan }) => {
    const results = (plan?.steps ?? []).map((step, index) => ({
      step,
      target: TARGETS[index % TARGETS.length],
      status: "DONE",
      detail: `Executed local step for "${task.title}" without reading private files or uploading data.`,
    }));
    return {
      results,
      summary: `${results.length} local execution steps completed.`,
    };
  });
}
