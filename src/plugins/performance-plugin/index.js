import { createPlugin } from "../plugin-factory.js";
export const metadata = { id: "performance-plugin", name: "Performance Plugin", version: "1.0.0", description: "Adaptive quality and system health integration.", dependencies: [], autoEnable: true };
export default (bus) => createPlugin(metadata, bus);
