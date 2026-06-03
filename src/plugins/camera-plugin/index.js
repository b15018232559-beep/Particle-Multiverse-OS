import { createPlugin } from "../plugin-factory.js";
export const metadata = { id: "camera-plugin", name: "Camera Plugin", version: "1.0.0", description: "Opt-in camera integration.", dependencies: [], autoEnable: true };
export default (bus) => createPlugin(metadata, bus);
