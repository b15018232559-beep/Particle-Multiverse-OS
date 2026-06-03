export class TransitionManager {
  constructor() {
    this.opacity = 1;
    this.active = false;
    this.elapsed = 0;
  }

  start() {
    this.active = true;
    this.elapsed = 0;
  }

  update(delta) {
    if (!this.active) return;
    this.elapsed += delta;
    const progress = Math.min(1, this.elapsed / 760);
    this.opacity = 0.28 + Math.sin(progress * Math.PI / 2) * 0.72;
    if (progress === 1) this.active = false;
  }
}
