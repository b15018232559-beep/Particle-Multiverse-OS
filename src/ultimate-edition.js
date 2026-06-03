export const ULTIMATE_EDITION = Object.freeze({
  product: "Particle Multiverse OS Ultimate Edition",
  release: "v2.0",
  codename: "World Tree Remaster",
  profile: "ULTIMATE",
  baseline: "v1.0 preserved",
  layers: [
    "Cinematic Particle Worlds",
    "Workspace Memory",
    "Agent Layer",
    "Multi-Agent System",
    "Mission Control",
  ],
});

export class UltimateEdition {
  constructor(bus, manifest = ULTIMATE_EDITION) {
    this.bus = bus;
    this.manifest = manifest;
  }

  start() {
    this.renderStaticIdentity();
    this.bus.emit("ULTIMATE_EDITION_READY", this.summary());
  }

  summary() {
    return {
      product: this.manifest.product,
      release: this.manifest.release,
      codename: this.manifest.codename,
      profile: this.manifest.profile,
      baseline: this.manifest.baseline,
      layers: [...this.manifest.layers],
    };
  }

  renderStaticIdentity() {
    document.title = this.manifest.product;
    this.setText("edition-release", this.manifest.release);
    this.setText("edition-codename", this.manifest.codename);
    this.setText("footer-edition", this.manifest.product.toUpperCase());
    this.setText("mission-edition", "PMOS ULTIMATE EDITION");
    this.setText("mission-edition-subtitle", `${this.manifest.release} / ${this.manifest.codename}`);
  }

  setText(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
  }
}
