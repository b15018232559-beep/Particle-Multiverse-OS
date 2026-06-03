export const QUALITY_LEVELS = {
  LOW: { particles: 3000, trails: 0.18, glow: true, links: 34, renderStride: 2, bloomStride: 23 },
  MEDIUM: { particles: 8000, trails: 0.13, glow: true, links: 56, renderStride: 1, bloomStride: 19 },
  HIGH: { particles: 15000, trails: 0.095, glow: true, links: 88, renderStride: 1, bloomStride: 17 },
  ULTRA: { particles: 30000, trails: 0.07, glow: true, links: 126, renderStride: 1, bloomStride: 13 },
};

export class PerformanceManager {
  constructor(onQualityChange) {
    this.quality = "HIGH";
    this.effectScale = 1;
    this.fps = 60;
    this.frames = 0;
    this.elapsed = 0;
    this.lowFpsWindows = 0;
    this.onQualityChange = onQualityChange;
  }

  setQuality(quality, automatic = false) {
    if (!QUALITY_LEVELS[quality] || quality === this.quality) return;
    this.quality = quality;
    this.onQualityChange(quality, automatic);
  }

  update(delta) {
    this.frames += 1;
    this.elapsed += delta;
    if (this.elapsed < 600) return false;
    this.fps = Math.round((this.frames * 1000) / this.elapsed);
    this.frames = 0;
    this.elapsed = 0;

    if (this.fps < 42) this.lowFpsWindows += 1;
    else this.lowFpsWindows = Math.max(0, this.lowFpsWindows - 1);

    if (this.lowFpsWindows >= 3) {
      if (this.effectScale > 0.62) this.effectScale -= 0.18;
      else {
        const levels = Object.keys(QUALITY_LEVELS);
        const index = levels.indexOf(this.quality);
        if (index > 0) this.setQuality(levels[index - 1], true);
      }
      this.lowFpsWindows = 0;
    }
    return true;
  }
}
