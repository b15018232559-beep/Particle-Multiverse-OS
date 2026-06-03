import { createCoordinatorAgent } from "./multi-agent/coordinator-agent.js";
import { createPlannerAgent } from "./multi-agent/planner-agent.js";
import { createExecutorAgent } from "./multi-agent/executor-agent.js";
import { createReviewerAgent } from "./multi-agent/reviewer-agent.js";
import { createMemoryAgent } from "./multi-agent/memory-agent.js";

const TASK_STATUS = {
  PENDING: "PENDING",
  RUNNING: "RUNNING",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED",
};

const DISCUSSION_LIMIT = 50;

function cloneTask(task) {
  return {
    id: task.id,
    title: task.title,
    status: task.status,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
    result: task.result ?? null,
    error: task.error ?? null,
  };
}

export class MultiAgentManager {
  constructor(bus, options = {}) {
    this.bus = bus;
    this.now = options.now ?? (() => Date.now());
    this.readMemory = options.readMemory ?? (() => ({}));
    this.activateLegacyAgent = options.activateLegacyAgent ?? (() => false);
    this.agents = new Map();
    this.tasks = [];
    this.discussion = [];
    this.collaborating = false;
    this.taskCounter = 0;
    this.registerDefaults();
    this.bind();
  }

  registerDefaults() {
    [
      createCoordinatorAgent(),
      createPlannerAgent(),
      createExecutorAgent(),
      createReviewerAgent(),
      createMemoryAgent(),
    ].forEach((agent) => this.register(agent));
  }

  bind() {
    this.bus.on("CONTEXT_CHANGED", ({ context }) => this.activateForContext(context));
  }

  register(agent) {
    try {
      agent.init();
      this.agents.set(agent.id, agent);
      this.bus.emit("AGENT_REGISTERED", { id: agent.id, name: agent.name, team: "multi-agent", status: agent.getStatus() });
      this.emitStatus();
      return agent;
    } catch (error) {
      this.bus.emit("AGENT_ERROR", { id: agent.id, name: agent.name, team: "multi-agent", error: error.message });
      return null;
    }
  }

  list() {
    return [...this.agents.values()].map((agent) => agent.getStatus());
  }

  createTask(title = "Collaborative workspace review", source = "system") {
    const task = {
      id: `task-${++this.taskCounter}`,
      title: String(title || "Collaborative workspace review").trim(),
      status: TASK_STATUS.PENDING,
      source,
      createdAt: new Date(this.now()).toISOString(),
      updatedAt: new Date(this.now()).toISOString(),
      result: null,
      error: null,
    };
    this.tasks.unshift(task);
    this.emitTask("AGENT_TASK_CREATED", task);
    this.addDiscussion("Coordinator", `Created task "${task.title}".`, "system");
    return cloneTask(task);
  }

  async startCollaboration(taskId = null) {
    this.collaborating = true;
    this.emitStatus();
    const runnable = taskId
      ? this.tasks.filter((task) => task.id === taskId && task.status === TASK_STATUS.PENDING)
      : [...this.tasks].reverse().filter((task) => task.status === TASK_STATUS.PENDING);
    for (const task of runnable) {
      if (!this.collaborating) break;
      await this.runTask(task);
    }
    this.emitStatus();
    return this.summary();
  }

  stopCollaboration() {
    this.collaborating = false;
    for (const agent of this.agents.values()) agent.idle();
    this.addDiscussion("Coordinator", "Collaboration stopped by user command.", "system");
    this.emitStatus();
    return this.summary();
  }

  showTaskBoard() {
    this.bus.emit("MULTI_AGENT_BOARD_REQUESTED", this.summary());
    return this.summary();
  }

  async runTask(task) {
    task.status = TASK_STATUS.RUNNING;
    task.updatedAt = new Date(this.now()).toISOString();
    this.emitTask("AGENT_TASK_STARTED", task);
    try {
      const coordinator = this.get("coordinator-agent");
      const planner = this.get("planner-agent");
      const executor = this.get("executor-agent");
      const reviewer = this.get("reviewer-agent");
      const memoryAgent = this.get("memory-agent");

      const assignment = this.runAgent(coordinator, { task, stage: "assign" });
      this.emitTask("AGENT_TASK_ASSIGNED", task, { assignee: assignment.assignee });
      this.addDiscussion("Coordinator", assignment.message, "assignment");

      const memory = this.runAgent(memoryAgent, { readMemory: this.readMemory });
      this.bus.emit("AGENT_MEMORY_LOADED", { task: cloneTask(task), memory });
      this.addDiscussion("Memory", `Loaded ${memory.taskHistory.length} task records and ${memory.agentHistory.length} agent records.`, "memory");

      const plan = this.runAgent(planner, { task, memory });
      this.addDiscussion("Planner", `Suggested ${plan.steps.length} steps: ${plan.steps.join(" / ")}`, "plan");

      const execution = this.runAgent(executor, { task, plan });
      this.addDiscussion("Executor", `Completed ${execution.results.length} steps across Scene, Music, Camera, Plugin, Workspace.`, "execution");

      const review = this.runAgent(reviewer, { task, plan, execution });
      this.bus.emit("AGENT_REVIEW_COMPLETED", { task: cloneTask(task), review });
      this.addDiscussion("Reviewer", `${review.message} Risk: ${review.risk}.`, "review");

      const finalResult = this.runAgent(coordinator, { task, plan, execution, review, stage: "final" });
      task.status = finalResult.status === "COMPLETED" ? TASK_STATUS.COMPLETED : TASK_STATUS.FAILED;
      task.result = finalResult;
      task.updatedAt = new Date(this.now()).toISOString();
      this.addDiscussion("Coordinator", finalResult.message, "final");
      this.emitTask(task.status === TASK_STATUS.COMPLETED ? "AGENT_TASK_COMPLETED" : "AGENT_TASK_FAILED", task);
      return cloneTask(task);
    } catch (error) {
      task.status = TASK_STATUS.FAILED;
      task.error = error.message;
      task.updatedAt = new Date(this.now()).toISOString();
      this.addDiscussion("Coordinator", `Task failed safely: ${error.message}`, "error");
      this.bus.emit("AGENT_ERROR", { team: "multi-agent", error: error.message, task: cloneTask(task) });
      this.emitTask("AGENT_TASK_FAILED", task);
      return cloneTask(task);
    }
  }

  runAgent(agent, payload) {
    if (!agent) throw new Error("Missing team agent");
    try {
      return agent.handleEvent(payload);
    } catch (error) {
      this.bus.emit("AGENT_ERROR", { id: agent.id, name: agent.name, team: "multi-agent", error: error.message });
      throw error;
    } finally {
      this.emitStatus();
    }
  }

  get(id) {
    return this.agents.get(id);
  }

  activateForContext(context) {
    for (const agent of this.agents.values()) agent.idle();
    if (context === "CODING") {
      this.get("planner-agent")?.activate();
      this.get("executor-agent")?.activate();
    }
    if (context === "STUDY") {
      this.get("memory-agent")?.activate();
      this.activateLegacyAgent("research-agent");
    }
    if (context === "PERFORMANCE_SAVE") {
      this.get("coordinator-agent")?.activate();
      this.get("memory-agent")?.activate();
    }
    this.emitStatus();
  }

  addDiscussion(agent, message, type = "discussion") {
    const entry = {
      id: `discussion-${this.now()}-${this.discussion.length}`,
      agent,
      type,
      message,
      createdAt: new Date(this.now()).toISOString(),
    };
    this.discussion.unshift(entry);
    this.discussion = this.discussion.slice(0, DISCUSSION_LIMIT);
    this.bus.emit("AGENT_DISCUSSION_ADDED", entry);
    return entry;
  }

  emitTask(event, task, extra = {}) {
    this.bus.emit(event, { task: cloneTask(task), ...extra });
    this.emitStatus();
  }

  emitStatus() {
    this.bus.emit("MULTI_AGENT_STATUS_CHANGED", this.summary());
  }

  summary() {
    const byStatus = Object.values(TASK_STATUS).reduce((acc, status) => {
      acc[status] = this.tasks.filter((task) => task.status === status).map(cloneTask);
      return acc;
    }, {});
    return {
      collaborating: this.collaborating,
      agents: this.list(),
      tasks: this.tasks.map(cloneTask),
      taskBoard: byStatus,
      discussion: [...this.discussion],
    };
  }
}

export { DISCUSSION_LIMIT, TASK_STATUS };
