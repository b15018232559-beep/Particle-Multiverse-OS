import { createPlugin } from "../plugin-factory.js";
export const metadata = { id: "effects-plugin", name: "Effects Plugin", version: "1.0.0", description: "Particle effects and shockwave integration.", dependencies: ["scene-plugin"], autoEnable: true };
export default (bus) => createPlugin(metadata, bus);
