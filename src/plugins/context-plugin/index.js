import { createPlugin } from "../plugin-factory.js";
export const metadata = { id: "context-plugin", name: "Context Plugin", version: "1.0.0", description: "AI Context recommendation integration.", dependencies: ["scene-plugin", "performance-plugin"], autoEnable: true };
export default (bus) => createPlugin(metadata, bus);
