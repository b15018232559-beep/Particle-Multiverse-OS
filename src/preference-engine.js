export class PreferenceEngine {
  constructor(bus) {
    this.bus = bus;
  }

  recommend(profile, workspaces = {}) {
    const scene = profile.mostUsedScene || profile.favoriteScene || "AI WORLD TREE";
    const quality = profile.favoriteQuality || "HIGH";
    const sceneWorkspace = Object.values(workspaces).find((workspace) => workspace.sceneName === scene);
    const recommendation = {
      scene,
      quality,
      workspace: sceneWorkspace?.name ?? "Custom Workspace",
      reason: profile.mostUsedScene ? "Most Used Scene" : "Default Preference",
    };
    this.bus.emit("PREFERENCE_UPDATED", recommendation);
    return recommendation;
  }
}
