import createStudyAgent from "./agents/study-agent.js";
import createCodingAgent from "./agents/coding-agent.js";
import createResearchAgent from "./agents/research-agent.js";
import createAutomationAgent from "./agents/automation-agent.js";

export class AgentLayer {
  constructor(bus, manager) {
    this.bus = bus;
    this.manager = manager;
    for (const createAgent of [createStudyAgent, createCodingAgent, createResearchAgent, createAutomationAgent]) {
      manager.register(createAgent());
    }
    bus.on("CONTEXT_CHANGED", ({ context }) => {
      manager.activateForContext(context);
      manager.collectSuggestions(null, "context");
    });
    for (const event of ["MEMORY_LOADED", "MEMORY_SAVED", "MEMORY_CLEARED"]) {
      bus.on(event, ({ profile = {}, lastWorkspace }) => manager.setState({
        favoriteScene: profile.favoriteScene,
        mostUsedScene: profile.mostUsedScene,
        lastWorkspace,
      }));
    }
  }

  open(id) {
    this.manager.enable(id, "user");
    return this.manager.collectSuggestions(id, "user");
  }

  closeAll() { return this.manager.disableAll("user"); }
  today() {
    if (!this.manager.list().some(({ status }) => status === "ACTIVE")) {
      const id = {
        CODING: "coding-agent",
        PERFORMANCE_SAVE: "automation-agent",
        STUDY: "study-agent",
      }[this.manager.state.currentContext] ?? "study-agent";
      return this.open(id);
    }
    return this.manager.collectSuggestions(null, "user");
  }
}
