export class AgentCenter {
  constructor(bus, manager, root) {
    this.bus = bus;
    this.manager = manager;
    this.root = root;
    this.open = false;
    this.list = root.querySelector("#agent-list");
    this.suggestions = root.querySelector("#agent-suggestions");
    root.querySelector("#agent-center-toggle").addEventListener("click", () => this.toggle());
    bus.on("AGENT_STATUS_CHANGED", () => this.render());
    for (const event of ["AGENT_SUGGESTION_CREATED", "AGENT_SUGGESTION_ACCEPTED", "AGENT_SUGGESTION_DISMISSED"]) {
      bus.on(event, () => this.render());
    }
  }

  toggle() {
    this.open = !this.open;
    this.root.classList.toggle("open", this.open);
    this.render();
  }

  render() {
    const summary = this.manager.summary();
    this.list.replaceChildren(...summary.agents.map((agent) => {
      const button = document.createElement("button");
      button.className = "agent-status";
      button.textContent = `${agent.name}: ${agent.status}`;
      button.addEventListener("click", () => {
        if (agent.status === "ACTIVE") this.manager.disable(agent.id, "button");
        else {
          this.manager.enable(agent.id, "button");
          this.manager.collectSuggestions(agent.id, "button");
        }
      });
      return button;
    }));
    this.suggestions.replaceChildren(...summary.suggestions.map((suggestion) => {
      const row = document.createElement("article");
      row.className = `agent-suggestion priority-${suggestion.priority}`;
      const text = document.createElement("p");
      text.textContent = `${suggestion.agent}: ${suggestion.message}`;
      const accept = document.createElement("button");
      accept.textContent = "ACCEPT";
      accept.addEventListener("click", () => this.manager.acceptSuggestion(suggestion.id));
      const dismiss = document.createElement("button");
      dismiss.textContent = "IGNORE";
      dismiss.addEventListener("click", () => this.manager.dismissSuggestion(suggestion.id));
      row.append(text, accept, dismiss);
      return row;
    }));
    if (!summary.suggestions.length) this.suggestions.textContent = "NO ACTIVE SUGGESTIONS";
  }
}
