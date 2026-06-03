import { createPlugin } from "../plugin-factory.js";
export const metadata = { id: "music-plugin", name: "Music Plugin", version: "1.0.0", description: "Music playback and Web Audio integration.", dependencies: ["effects-plugin"], autoEnable: true };
export default (bus) => createPlugin(metadata, bus);
