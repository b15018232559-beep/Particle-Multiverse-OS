import { createPlugin } from "../plugin-factory.js";
export const metadata = { id: "scene-plugin", name: "Scene Plugin", version: "1.0.0", description: "Scene management and world switching.", dependencies: [], autoEnable: true };
export default (bus) => createPlugin(metadata, bus);
