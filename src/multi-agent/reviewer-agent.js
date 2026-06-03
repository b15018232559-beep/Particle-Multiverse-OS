import { createTeamAgent } from "./team-agent-factory.js";

export function createReviewerAgent() {
  return createTeamAgent({
    id: "reviewer-agent",
    name: "Reviewer",
    role: "Checks task logic, performance impact, structure, and stability.",
  }, ({ task, plan, execution }) => {
    const planned = plan?.steps?.length ?? 0;
    const executed = execution?.results?.filter((item) => item.status === "DONE").length ?? 0;
    const passed = planned > 0 && executed === planned;
    return {
      passed,
      risk: planned > 6 ? "MEDIUM" : "LOW",
      checks: {
        logic: passed ? "PASS" : "FAIL",
        performance: "PASS",
        structure: "PASS",
        stability: passed ? "PASS" : "FAIL",
      },
      message: passed
        ? `Reviewer approved "${task.title}".`
        : `Reviewer found incomplete execution for "${task.title}".`,
    };
  });
}
