export class TaskBoard {
  constructor(bus, manager, root, options = {}) {
    this.bus = bus;
    this.manager = manager;
    this.root = root;
    this.intervalMs = options.intervalMs ?? 200;
    this.open = false;
    this.state = manager.summary();
    this.renderTimer = null;
    this.bind();
  }

  bind() {
    this.root.querySelector("#multi-agent-toggle")?.addEventListener("click", () => this.toggle());
    this.root.querySelector("#multi-agent-create")?.addEventListener("click", () => {
      const input = this.root.querySelector("#multi-agent-task-input");
      this.manager.createTask(input?.value || "Collaborative workspace review", "button");
      if (input) input.value = "";
      this.setOpen(true);
    });
    this.root.querySelector("#multi-agent-start")?.addEventListener("click", () => {
      this.manager.startCollaboration();
      this.setOpen(true);
    });
    this.root.querySelector("#multi-agent-stop")?.addEventListener("click", () => this.manager.stopCollaboration());
    this.root.querySelector("#multi-agent-status")?.addEventListener("click", () => {
      this.manager.showTaskBoard();
      this.setOpen(true);
    });
    for (const event of [
      "MULTI_AGENT_STATUS_CHANGED",
      "AGENT_TASK_CREATED",
      "AGENT_TASK_STARTED",
      "AGENT_TASK_COMPLETED",
      "AGENT_TASK_FAILED",
      "AGENT_DISCUSSION_ADDED",
      "MULTI_AGENT_BOARD_REQUESTED",
    ]) {
      this.bus.on(event, (summary) => {
        this.state = summary?.agents ? summary : this.manager.summary();
        this.scheduleRender();
      });
    }
  }

  toggle() {
    this.setOpen(!this.open);
  }

  setOpen(open) {
    this.open = Boolean(open);
    this.root.classList.toggle("open", this.open);
    this.render();
  }

  scheduleRender() {
    if (this.renderTimer) return;
    this.renderTimer = setTimeout(() => {
      this.renderTimer = null;
      this.render();
    }, this.intervalMs);
  }

  render() {
    const toggle = this.root.querySelector("#multi-agent-toggle small");
    if (toggle) toggle.textContent = this.open ? "COLLAPSE" : "EXPAND";
    this.renderAgents();
    this.renderTasks();
    this.renderDiscussion();
  }

  renderAgents() {
    const list = this.root.querySelector("#multi-agent-list");
    if (!list) return;
    list.replaceChildren(...this.state.agents.map((agent) => {
      const item = document.createElement("div");
      item.className = `team-agent status-${agent.status.toLowerCase()}`;
      item.innerHTML = `<b>${agent.name}</b><span>${agent.status}</span><small>${agent.role}</small>`;
      return item;
    }));
  }

  renderTasks() {
    const flow = this.root.querySelector("#task-flow");
    if (flow) {
      flow.textContent = "User -> Coordinator -> Planner -> Executor -> Reviewer -> Coordinator -> Final Output";
    }
    const board = this.root.querySelector("#task-board");
    if (!board) return;
    const statuses = ["PENDING", "RUNNING", "COMPLETED", "FAILED"];
    board.replaceChildren(...statuses.map((status) => {
      const column = document.createElement("section");
      column.className = `task-column task-${status.toLowerCase()}`;
      const tasks = this.state.taskBoard?.[status] ?? [];
      column.innerHTML = `<h4>${status}</h4>${tasks.length ? "" : "<p>EMPTY</p>"}`;
      for (const task of tasks.slice(0, 4)) {
        const row = document.createElement("article");
        row.textContent = task.title;
        column.append(row);
      }
      return column;
    }));
  }

  renderDiscussion() {
    const list = this.root.querySelector("#agent-discussion");
    if (!list) return;
    const entries = this.state.discussion.slice(0, 6);
    if (!entries.length) {
      list.textContent = "NO RECENT AGENT DISCUSSION";
      return;
    }
    list.replaceChildren(...entries.map((entry) => {
      const item = document.createElement("p");
      const agent = document.createElement("b");
      agent.textContent = entry.agent;
      item.append(agent, `: ${entry.message}`);
      return item;
    }));
  }
}
