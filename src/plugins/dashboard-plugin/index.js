import { createPlugin } from "../plugin-factory.js";
export const metadata = { id: "dashboard-plugin", name: "Dashboard Plugin", version: "1.0.0", description: "Ultimate Dashboard and Plugin Center integration.", dependencies: ["performance-plugin"], autoEnable: true };
export default (bus) => createPlugin(metadata, bus);
