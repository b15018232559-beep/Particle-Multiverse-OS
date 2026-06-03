import { createPlugin } from "../plugin-factory.js";
export const metadata = { id: "gesture-plugin", name: "Gesture Plugin", version: "1.0.0", description: "Hand gesture recognition integration.", dependencies: ["camera-plugin"], autoEnable: true };
export default (bus) => createPlugin(metadata, bus);
