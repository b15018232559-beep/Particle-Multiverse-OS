import { createTeamAgent } from "./team-agent-factory.js";

export function createCoordinatorAgent() {
  return createTeamAgent({
    id: "coordinator-agent",
    name: "Coordinator",
    role: "Receives tasks, coordinates team agents, and produces the final result.",
  }, ({ task, plan, execution, review, stage }) => {
    if (stage === "assign") {
      return {
        assignee: "planner-agent",
        message: `Coordinator accepted "${task.title}" and assigned planning.`,
      };
    }
    return {
      status: review?.passed ? "COMPLETED" : "FAILED",
      message: review?.passed
        ? `Coordinator approved "${task.title}" after review.`
        : `Coordinator stopped "${task.title}" because review failed.`,
      planSteps: plan?.steps?.length ?? 0,
      executedSteps: execution?.results?.length ?? 0,
      review,
    };
  });
}
