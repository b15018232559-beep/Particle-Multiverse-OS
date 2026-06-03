export class ShockwaveEffect {
  constructor() {
    this.waves = [];
  }

  trigger(x, y, accent) {
    this.waves.push({ x, y, radius: 12, alpha: 0.75, accent });
  }

  update(delta) {
    for (const wave of this.waves) {
      wave.radius += delta * 0.52;
      wave.alpha -= delta * 0.00062;
    }
    this.waves = this.waves.filter((wave) => wave.alpha > 0);
  }

  draw(ctx) {
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    for (const wave of this.waves) {
      ctx.strokeStyle = wave.accent;
      ctx.globalAlpha = Math.max(0, wave.alpha);
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(wave.x, wave.y, wave.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha *= 0.22;
      ctx.lineWidth = 12;
      ctx.stroke();
    }
    ctx.restore();
  }
}
