import { createAgent } from "./agent-factory.js";

const metadata = { id: "coding-agent", name: "Coding Agent", description: "Project status, development stage, file structure, and next-step guidance." };

export default function createCodingAgent() {
  return createAgent(metadata, () => [{
    message: "Review the current development stage and update PROJECT_STATUS.md.",
    priority: "medium",
    action: "open_project_status",
  }]);
}
