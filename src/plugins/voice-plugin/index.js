import { createPlugin } from "../plugin-factory.js";
export const metadata = { id: "voice-plugin", name: "Voice Plugin", version: "1.0.0", description: "Opt-in Web Speech voice integration.", dependencies: ["keyboard-plugin"], autoEnable: false };
export default (bus) => createPlugin(metadata, bus);
