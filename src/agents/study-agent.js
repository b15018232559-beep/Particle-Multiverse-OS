import { createAgent } from "./agent-factory.js";

const metadata = { id: "study-agent", name: "Study Agent", description: "Learning mode, review reminders, knowledge organization, and Study Workspace recommendations." };

export default function createStudyAgent() {
  return createAgent(metadata, (state) => [{
    message: state.currentContext === "STUDY" ? "Review your learning notes and save the Study Workspace." : "Switch to Study Workspace for a focused review session.",
    priority: "medium",
    action: "load_study_workspace",
  }]);
}
