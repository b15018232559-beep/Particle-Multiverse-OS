import { createPlugin } from "../plugin-factory.js";
export const metadata = { id: "keyboard-plugin", name: "Keyboard Plugin", version: "1.0.0", description: "Keyboard shortcut routing integration.", dependencies: [], autoEnable: true };
export default (bus) => createPlugin(metadata, bus);
