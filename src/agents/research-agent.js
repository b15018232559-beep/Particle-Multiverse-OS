import { createAgent } from "./agent-factory.js";

const metadata = { id: "research-agent", name: "Research Agent", description: "Research organization, report structure, citation reminders, and data-analysis entry points." };

export default function createResearchAgent() {
  return createAgent(metadata, () => [{
    message: "Organize sources, verify citations, and outline the next report section.",
    priority: "medium",
    action: "review_research_outline",
  }]);
}
