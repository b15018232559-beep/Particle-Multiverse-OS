import { positionParticle } from "./particle-presets.js";
import { QUALITY_LEVELS } from "./performance-manager.js";

const TAU = Math.PI * 2;

export class ParticleEngine {
  constructor(canvas, shockwaves, transitions) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d", { alpha: false });
    this.shockwaves = shockwaves;
    this.transitions = transitions;
    this.pool = [];
    this.particles = [];
    this.preset = null;
    this.quality = QUALITY_LEVELS.HIGH;
    this.effectScale = 1;
    this.pointer = { x: 0, y: 0, active: false, holding: false };
    this.scrollImpulse = 0;
    this.burstForce = 0;
    this.coreScale = 1;
    this.targetCoreScale = 1;
    this.focusStrength = 0;
    this.calmLevel = 0;
    this.orbitBoost = 0;
    this.musicMode = false;
    this.music = { volume: 0, bass: 0, mid: 0, treble: 0, beat: 0, energy: 0 };
    this.musicGlow = 0;
    this.branchGrowth = 0;
    this.accretionBoost = 0;
    this.ringPulse = 0;
    this.neuralPulse = 0;
    this.foldPulse = 0;
    this.ultimatePulse = 0;
    this.rotation = 0;
    this.time = 0;
    this.camera = { x: 0, y: 0, zoom: 1, focus: 0 };
    this.spriteCache = new Map();
    this.gpu = null;
    this.width = 0;
    this.height = 0;
    this.dpr = 1;
    this.resize();
  }

  resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.dpr = Math.min(window.devicePixelRatio || 1, 1.6);
    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.resizeGpu();
    if (this.preset) this.configure(this.preset, this.quality);
  }

  configure(preset, quality) {
    this.preset = preset;
    this.quality = quality;
    const target = quality.particles;
    while (this.pool.length + this.particles.length < target) this.pool.push({});
    while (this.particles.length < target) this.particles.push(this.pool.pop());
    while (this.particles.length > target) this.pool.push(this.particles.pop());
    this.particles.forEach((particle, index) => positionParticle(particle, index, target, preset, this.width, this.height));
  }

  setPointer(x, y, active = true) {
    this.pointer.x = x;
    this.pointer.y = y;
    this.pointer.active = active;
  }

  setHolding(holding) {
    this.pointer.holding = holding;
  }

  scroll(delta) {
    this.scrollImpulse = Math.max(-1.6, Math.min(1.6, this.scrollImpulse + Math.sign(delta) * 0.42));
  }

  burst(x = this.width / 2, y = this.height / 2) {
    this.setPointer(x, y, true);
    this.burstForce = 1;
    this.shockwaves.trigger(x, y, this.preset.accent);
  }

  reset() {
    this.pointer.active = false;
    this.pointer.holding = false;
    this.scrollImpulse = 0;
    this.burstForce = 0;
    this.coreScale = 1;
    this.targetCoreScale = 1;
    this.focusStrength = 0;
    this.calmLevel = 0;
    this.orbitBoost = 0;
    if (this.preset) this.configure(this.preset, this.quality);
  }

  applyGesture({ type, x, y, strength = 1 }) {
    const px = x * this.width;
    const py = y * this.height;
    if (type === "OPEN_HAND") {
      this.setPointer(px, py);
      this.setHolding(false);
      this.scrollImpulse = Math.min(1.6, this.scrollImpulse + 0.55);
      this.burstForce = Math.max(this.burstForce, 0.12);
    } else if (type === "FIST") {
      this.setPointer(px, py);
      this.setHolding(true);
      this.scrollImpulse = Math.max(-1.6, this.scrollImpulse - 0.5);
    } else if (type === "POINT") {
      this.setPointer(px, py);
      this.setHolding(false);
    } else if (type === "PINCH") {
      this.setPointer(px, py);
      this.setHolding(true);
      this.focusStrength = Math.max(this.focusStrength, 1);
    } else if (type === "DOUBLE_OPEN") {
      this.burst(px, py);
      this.burstForce = 1.45;
      this.targetCoreScale = Math.min(1.5, this.targetCoreScale + 0.18);
    } else if (type === "DOUBLE_FIST") {
      this.setPointer(this.width / 2, this.height / 2);
      this.setHolding(true);
      this.focusStrength = Math.max(this.focusStrength, 0.62);
      this.calmLevel = 1;
      this.targetCoreScale = Math.max(0.82, this.targetCoreScale - 0.08);
    } else if (type === "EXPAND") {
      this.setHolding(false);
      this.targetCoreScale = Math.min(1.7, this.targetCoreScale + 0.2 * strength);
      this.scrollImpulse = Math.min(1.6, this.scrollImpulse + 0.7 * strength);
    } else if (type === "COLLAPSE") {
      this.setPointer(this.width / 2, this.height / 2);
      this.setHolding(true);
      this.focusStrength = Math.max(this.focusStrength, 0.88);
      this.targetCoreScale = Math.max(0.58, this.targetCoreScale - 0.18 * strength);
      this.scrollImpulse = Math.max(-1.6, this.scrollImpulse - 0.62 * strength);
    } else if (type === "CIRCLE_MOTION") {
      this.setHolding(false);
      this.orbitBoost = 1;
    } else if (type === "NONE") {
      this.setHolding(false);
    }
  }

  setMusicMode(enabled) {
    this.musicMode = enabled;
    if (!enabled) {
      this.music = { volume: 0, bass: 0, mid: 0, treble: 0, beat: 0, energy: 0 };
      this.musicGlow = 0;
      this.branchGrowth = 0;
      this.accretionBoost = 0;
      this.ringPulse = 0;
      this.neuralPulse = 0;
      this.foldPulse = 0;
      this.ultimatePulse = 0;
    }
  }

  applyMusic(analysis, behavior) {
    if (!this.musicMode) return;
    this.music = analysis;
    this.scrollImpulse = Math.min(1.6, Math.max(this.scrollImpulse, analysis.bass * 1.05));
    this.orbitBoost = Math.max(this.orbitBoost, analysis.mid * 0.72);
    this.musicGlow = analysis.energy;
    this.branchGrowth = behavior === "tree" ? analysis.energy : 0;
    this.accretionBoost = behavior === "vortex" ? analysis.mid : 0;
    this.ringPulse = behavior === "reactor" ? analysis.bass : 0;
    this.neuralPulse = behavior === "neural" ? Math.max(analysis.treble, analysis.beat) : 0;
    this.foldPulse = behavior === "tesseract" ? analysis.mid : 0;
    this.ultimatePulse = behavior === "ultimate" ? analysis.energy : 0;
  }

  musicPulse() {
    if (!this.musicMode || !this.preset) return;
    const x = this.width / 2;
    const y = this.height / 2;
    this.burstForce = Math.max(this.burstForce, 0.32);
    this.shockwaves.trigger(x, y, this.preset.accent);
  }

  update(delta) {
    if (!this.preset) return;
    if (!this.camera) this.camera = { x: 0, y: 0, zoom: 1, focus: 0 };
    if (!Number.isFinite(this.time)) this.time = 0;
    const step = Math.min(2.1, delta / 16.667);
    this.time += delta * 0.001;
    this.camera.x = Math.sin(this.time * 0.17) * 18 + Math.sin(this.time * 0.071) * 9;
    this.camera.y = Math.cos(this.time * 0.13) * 12 + Math.sin(this.time * 0.053) * 7;
    this.camera.zoom = 1 + Math.sin(this.time * 0.21) * 0.018 + this.music.energy * 0.012;
    this.camera.focus = 0.5 + Math.sin(this.time * 0.19) * 0.5;
    this.rotation += (0.004 + this.accretionBoost * 0.006 + this.ultimatePulse * 0.003) * step * this.preset.speed;
    this.scrollImpulse *= Math.pow(0.94, step);
    this.burstForce *= Math.pow(0.93, step);
    this.focusStrength *= Math.pow(0.91, step);
    this.calmLevel *= Math.pow(0.988, step);
    this.orbitBoost *= Math.pow(0.965, step);
    this.targetCoreScale += (1 - this.targetCoreScale) * 0.004 * step;
    this.coreScale += (this.targetCoreScale - this.coreScale) * 0.08 * step;
    const cx = this.width / 2;
    const cy = this.height / 2;
    const { behavior, speed } = this.preset;

    for (let i = 0; i < this.particles.length; i += 1) {
      const p = this.particles[i];
      const phase = this.rotation + p.phase;
      const dx = this.pointer.x - p.x;
      const dy = this.pointer.y - p.y;
      const distance = Math.max(28, Math.hypot(dx, dy));
      const nearby = this.pointer.active && distance < 280;
      if (nearby) {
        const force = (1 - distance / 280) * (this.pointer.holding ? 0.115 : 0.045) * step;
        p.vx += (dx / distance) * force;
        p.vy += (dy / distance) * force;
        if (behavior === "tree") p.vy -= force * 0.72;
        else if (behavior === "vortex") {
          p.vx -= (dy / distance) * force * 1.35;
          p.vy += (dx / distance) * force * 1.35;
        } else if (behavior === "reactor") {
          p.vx -= (dx / distance) * force * 0.42;
          p.vy -= (dy / distance) * force * 0.42;
        } else if (behavior === "neural") {
          p.vx += Math.sin(p.phase * 3) * force * 0.7;
          p.vy += Math.cos(p.phase * 3) * force * 0.7;
        } else if (behavior === "tesseract") {
          p.vx -= (dy / distance) * force * 0.7;
          p.vy += (dx / distance) * force * 0.7;
        } else {
          p.vx += Math.sin(phase * 2) * force;
          p.vy += Math.cos(phase * 2) * force;
        }
      }
      if (this.focusStrength > 0.025 && this.pointer.active) {
        const focus = this.focusStrength * 0.085 * step;
        p.vx += (dx / distance) * focus;
        p.vy += (dy / distance) * focus;
      }
      if (this.orbitBoost > 0.025) {
        const ox = p.x - cx;
        const oy = p.y - cy;
        const orbitDistance = Math.max(32, Math.hypot(ox, oy));
        const orbit = this.orbitBoost * 0.16 * step;
        p.vx -= (oy / orbitDistance) * orbit;
        p.vy += (ox / orbitDistance) * orbit;
      }
      if (this.burstForce > 0.025) {
        const burstDistance = Math.max(22, distance);
        const burst = this.burstForce * 1.05 * step;
        p.vx -= (dx / burstDistance) * burst;
        p.vy -= (dy / burstDistance) * burst;
      }

      if (behavior === "tree") {
        const wind = Math.sin(phase * 1.8 + p.baseY * 0.008 + this.time) * (8 + p.depth * 18) + (p.baseX - cx) * this.scrollImpulse * 0.1;
        const growth = this.coreScale + this.branchGrowth * 0.24 + Math.sin(this.time * 0.8 + p.seed) * 0.018;
        const flow = Math.sin(this.time * 1.4 + p.seed * 6) * 12 * (p.flow ?? 1);
        p.vx += (cx + (p.baseX - cx) * growth + wind - p.x) * 0.009 * step;
        p.vy += (cy + (p.baseY - cy) * growth + flow - p.y) * 0.009 * step;
      } else if (behavior === "vortex") {
        const angle = Math.atan2((p.y - cy) / 0.38, p.x - cx) + (0.012 + (p.infall ?? 0.4) * 0.003) * speed * step;
        const pull = Math.sin(this.time * 0.6 + p.seed) * 10 - this.burstForce * 16;
        const radius = (p.orbit * this.coreScale + this.scrollImpulse * 44 + pull) * (0.92 + Math.sin(phase) * 0.07);
        p.vx += (cx + Math.cos(angle) * radius - p.x) * 0.025 * step;
        p.vy += (cy + Math.sin(angle) * radius * 0.38 - p.y) * 0.025 * step;
      } else if (behavior === "reactor") {
        const angle = Math.atan2(p.y - cy, p.x - cx) + (i % 2 ? 1 : -1) * (0.017 + (p.arc ? 0.008 : 0)) * speed * step;
        const pulse = Math.sin(this.time * 3.1 - p.orbit * 0.04) * (8 + this.ringPulse * 30);
        const radius = p.orbit * this.coreScale + pulse + this.scrollImpulse * 24;
        p.vx += (cx + Math.cos(angle) * radius - p.x) * 0.04 * step;
        p.vy += (cy + Math.sin(angle) * radius - p.y) * 0.04 * step;
      } else if (behavior === "neural") {
        const neuralScale = 1 + this.scrollImpulse * 0.16 + Math.sin(this.time * 0.7) * 0.035;
        const signal = Math.max(this.neuralPulse, Math.sin(this.time * 2.4 + p.signal * 9) > 0.92 ? 1 : 0);
        p.vx += (cx + (p.baseX - cx) * neuralScale * this.coreScale + Math.sin(phase * 1.6) * (24 + signal * 46) - p.x) * 0.01 * step;
        p.vy += (cy + (p.baseY - cy) * neuralScale * this.coreScale + Math.cos(phase * 1.3) * (19 + signal * 38) - p.y) * 0.01 * step;
      } else if (behavior === "tesseract") {
        const cosine = Math.cos(this.rotation * (1 + (p.hyper ?? 1) * 0.35)), sine = Math.sin(this.rotation * (1.2 + (p.hyper ?? 1) * 0.25));
        const rx = p.baseX - cx, ry = p.baseY - cy;
        const depthScale = 0.68 + (Math.sin(phase + this.time) + 1) * (0.22 + this.foldPulse * 0.14) + this.scrollImpulse * 0.12;
        p.vx += (cx + (rx * cosine - ry * sine) * depthScale * this.coreScale - p.x) * 0.035 * step;
        p.vy += (cy + (rx * sine + ry * cosine) * depthScale * this.coreScale - p.y) * 0.035 * step;
      } else {
        const worldAngle = (p.world ?? 0) * TAU / 5 + this.rotation * 0.62;
        const local = phase * 1.8 + this.rotation * (1.4 + (p.world ?? 0) * 0.12);
        const worldRadius = p.orbit * (this.coreScale + this.ultimatePulse * 0.1);
        const wx = cx + Math.cos(worldAngle) * worldRadius;
        const wy = cy + Math.sin(worldAngle) * worldRadius * 0.62;
        const localRadius = 18 + p.depth * 48 + Math.sin(phase * 2) * (10 + this.ultimatePulse * 22);
        p.vx += (wx + Math.cos(local) * localRadius - p.x) * 0.025 * step;
        p.vy += (wy + Math.sin(local) * localRadius * 0.72 - p.y) * 0.025 * step;
      }
      p.x += p.vx * step;
      p.y += p.vy * step;
      p.vx *= Math.pow(0.91, step);
      p.vy *= Math.pow(0.91, step);
      if (this.calmLevel > 0.025) {
        const calmDamping = Math.pow(1 - this.calmLevel * 0.055, step);
        p.vx *= calmDamping;
        p.vy *= calmDamping;
      }
    }
  }

  drawBackground() {
    const ctx = this.ctx;
    ctx.globalAlpha = 1;
    ctx.fillStyle = `rgba(2, 4, 14, ${this.quality.trails})`;
    ctx.fillRect(0, 0, this.width, this.height);
    const gradient = ctx.createRadialGradient(this.width / 2, this.height / 2, 0, this.width / 2, this.height / 2, this.width * 0.62);
    gradient.addColorStop(0, `${this.preset.accent}2a`);
    gradient.addColorStop(0.38, `${this.preset.accent}10`);
    gradient.addColorStop(1, "#02040e00");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.width, this.height);
    this.drawVolumetricField(ctx);
  }

  draw() {
    if (!this.preset) return;
    const ctx = this.ctx;
    this.drawBackground();
    ctx.save();
    this.applyCamera(ctx);
    ctx.globalCompositeOperation = "screen";
    ctx.globalAlpha = this.transitions.opacity;
    this.drawParticleField(ctx);
    if (this.quality.glow) {
      this.drawBloom(ctx);
    }
    this.drawStructure(ctx);
    ctx.restore();
    this.drawForegroundAtmosphere(ctx);
    this.shockwaves.draw(ctx);
  }

  applyCamera(ctx) {
    ctx.translate(this.width / 2, this.height / 2);
    ctx.scale(this.camera.zoom, this.camera.zoom);
    ctx.translate(-this.width / 2 + this.camera.x, -this.height / 2 + this.camera.y);
  }

  drawParticleField(ctx) {
    if (this.drawGpuParticleField(ctx)) return;
    const stride = this.quality.renderStride ?? 1;
    for (let index = 0; index < this.particles.length; index += stride) {
      const p = this.particles[index];
      const flicker = this.musicMode ? 1 + this.music.treble * (0.08 + Math.sin(p.phase * 9 + this.rotation * 18) * 0.14) : 1;
      const depthScale = p.layer === "near" ? 1.28 : p.layer === "mid" ? 0.92 : 0.58;
      const parallaxX = this.camera.x * (p.parallax ?? 0.5);
      const parallaxY = this.camera.y * (p.parallax ?? 0.5);
      const size = Math.max(1.2, p.size * flicker * depthScale);
      const sprite = this.sprite(p.color, p.layer, size);
      ctx.globalAlpha = this.transitions.opacity * this.effectScale * (p.layer === "near" ? 0.92 : p.layer === "mid" ? 0.62 : 0.34);
      ctx.drawImage(sprite, p.x - size * 4 + parallaxX, p.y - size * 4 + parallaxY, size * 8, size * 8);
    }
  }

  drawGpuParticleField(ctx) {
    const gpu = this.ensureGpu();
    if (!gpu) return false;
    const gl = gpu.gl;
    const count = this.particles.length;
    const data = gpu.data.length >= count * 8 ? gpu.data : new Float32Array(count * 8);
    gpu.data = data;
    for (let i = 0; i < count; i += 1) {
      const p = this.particles[i];
      const color = this.colorVec(p.color);
      const depthScale = p.layer === "near" ? 1.28 : p.layer === "mid" ? 0.92 : 0.58;
      const alpha = this.transitions.opacity * this.effectScale * (p.layer === "near" ? 0.92 : p.layer === "mid" ? 0.62 : 0.34);
      const offset = i * 8;
      data[offset] = p.x + this.camera.x * (p.parallax ?? 0.5);
      data[offset + 1] = p.y + this.camera.y * (p.parallax ?? 0.5);
      data[offset + 2] = Math.max(1.2, p.size * depthScale);
      data[offset + 3] = color[0];
      data[offset + 4] = color[1];
      data[offset + 5] = color[2];
      data[offset + 6] = alpha;
      data[offset + 7] = p.depth;
    }

    gl.viewport(0, 0, gpu.canvas.width, gpu.canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(gpu.program);
    gl.uniform2f(gpu.resolution, this.width, this.height);
    gl.uniform1f(gpu.dpr, this.dpr);
    gl.bindBuffer(gl.ARRAY_BUFFER, gpu.instanceBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, data.subarray(0, count * 8), gl.DYNAMIC_DRAW);
    gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, count);
    ctx.drawImage(gpu.canvas, 0, 0, this.width, this.height);
    return true;
  }

  ensureGpu() {
    if (this.gpu?.failed) return null;
    if (this.gpu?.gl) return this.gpu;
    try {
      const canvas = typeof OffscreenCanvas !== "undefined" ? new OffscreenCanvas(this.canvas.width, this.canvas.height) : document.createElement("canvas");
      canvas.width = this.canvas.width;
      canvas.height = this.canvas.height;
      const gl = canvas.getContext("webgl2", { alpha: true, antialias: false, depth: false, premultipliedAlpha: true });
      if (!gl) throw new Error("WebGL2 unavailable");
      const vertex = `#version 300 es
        in vec2 aCorner;
        in vec2 iPosition;
        in float iSize;
        in vec4 iColor;
        in float iDepth;
        uniform vec2 uResolution;
        uniform float uDpr;
        out vec2 vCorner;
        out vec4 vColor;
        void main() {
          float depth = mix(0.72, 1.34, iDepth);
          vec2 pixel = iPosition + aCorner * iSize * 4.2 * depth;
          vec2 zeroToOne = pixel / uResolution;
          vec2 clip = zeroToOne * 2.0 - 1.0;
          gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
          vCorner = aCorner;
          vColor = iColor;
        }`;
      const fragment = `#version 300 es
        precision mediump float;
        in vec2 vCorner;
        in vec4 vColor;
        out vec4 outColor;
        void main() {
          float d = length(vCorner);
          float core = smoothstep(1.0, 0.0, d);
          float glow = smoothstep(1.0, 0.08, d) * 0.45;
          float alpha = (core + glow) * vColor.a;
          outColor = vec4(vColor.rgb * (1.25 + glow), alpha);
        }`;
      const program = this.program(gl, vertex, fragment);
      const cornerBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, cornerBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
      const aCorner = gl.getAttribLocation(program, "aCorner");
      gl.enableVertexAttribArray(aCorner);
      gl.vertexAttribPointer(aCorner, 2, gl.FLOAT, false, 0, 0);

      const instanceBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, instanceBuffer);
      const stride = 8 * 4;
      const attributes = [
        ["iPosition", 2, 0],
        ["iSize", 1, 2],
        ["iColor", 4, 3],
        ["iDepth", 1, 7],
      ];
      for (const [name, size, offset] of attributes) {
        const location = gl.getAttribLocation(program, name);
        gl.enableVertexAttribArray(location);
        gl.vertexAttribPointer(location, size, gl.FLOAT, false, stride, offset * 4);
        gl.vertexAttribDivisor(location, 1);
      }
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
      this.gpu = {
        canvas, gl, program, instanceBuffer, data: new Float32Array(0),
        resolution: gl.getUniformLocation(program, "uResolution"),
        dpr: gl.getUniformLocation(program, "uDpr"),
      };
      return this.gpu;
    } catch {
      this.gpu = { failed: true };
      return null;
    }
  }

  resizeGpu() {
    if (!this.gpu?.canvas) return;
    this.gpu.canvas.width = this.canvas.width;
    this.gpu.canvas.height = this.canvas.height;
  }

  program(gl, vertexSource, fragmentSource) {
    const shader = (type, source) => {
      const item = gl.createShader(type);
      gl.shaderSource(item, source);
      gl.compileShader(item);
      if (!gl.getShaderParameter(item, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(item));
      return item;
    };
    const program = gl.createProgram();
    gl.attachShader(program, shader(gl.VERTEX_SHADER, vertexSource));
    gl.attachShader(program, shader(gl.FRAGMENT_SHADER, fragmentSource));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
    return program;
  }

  colorVec(color) {
    const hex = color.replace("#", "");
    const value = Number.parseInt(hex.length === 3 ? hex.split("").map((c) => c + c).join("") : hex, 16);
    return [((value >> 16) & 255) / 255, ((value >> 8) & 255) / 255, (value & 255) / 255];
  }

  drawBloom(ctx) {
    const stride = this.quality.bloomStride ?? 17;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = this.preset.accent;
    ctx.shadowColor = this.preset.accent;
    ctx.shadowBlur = (22 + this.musicGlow * 34) * this.effectScale;
    for (let index = 0; index < this.particles.length; index += stride) {
      const p = this.particles[index];
      const radius = p.size * (p.layer === "near" ? 2.8 : 1.9);
      ctx.globalAlpha = (0.12 + p.depth * 0.12 + this.musicGlow * 0.12) * this.transitions.opacity * this.effectScale;
      ctx.beginPath();
      ctx.arc(p.x, p.y, radius, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  drawVolumetricField(ctx) {
    const cx = this.width / 2 + Math.sin(this.time * 0.09) * 80;
    const cy = this.height / 2 + Math.cos(this.time * 0.07) * 50;
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    for (let i = 0; i < 4; i += 1) {
      const radius = this.width * (0.22 + i * 0.13);
      const fog = ctx.createRadialGradient(cx, cy, radius * 0.04, cx, cy, radius);
      fog.addColorStop(0, `${this.preset.accent}${i === 0 ? "20" : "10"}`);
      fog.addColorStop(0.5, `${this.preset.accent}08`);
      fog.addColorStop(1, "#00000000");
      ctx.fillStyle = fog;
      ctx.globalAlpha = (0.28 - i * 0.04) * this.effectScale;
      ctx.fillRect(0, 0, this.width, this.height);
    }
    ctx.restore();
  }

  drawForegroundAtmosphere(ctx) {
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    const cx = this.width / 2;
    const cy = this.height / 2;
    for (let i = 0; i < 7; i += 1) {
      const angle = this.rotation * 0.12 + i * TAU / 7;
      const gradient = ctx.createLinearGradient(cx, cy, cx + Math.cos(angle) * this.width, cy + Math.sin(angle) * this.height);
      gradient.addColorStop(0, `${this.preset.accent}14`);
      gradient.addColorStop(0.28, `${this.preset.accent}04`);
      gradient.addColorStop(1, "#00000000");
      ctx.strokeStyle = gradient;
      ctx.globalAlpha = 0.16 * this.effectScale;
      ctx.lineWidth = 22 + i * 5;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(angle) * this.width, cy + Math.sin(angle) * this.height);
      ctx.stroke();
    }
    ctx.restore();
  }

  sprite(color, layer, size) {
    const key = `${color}:${layer}:${Math.round(size * 2)}`;
    if (this.spriteCache.has(key)) return this.spriteCache.get(key);
    const canvas = document.createElement("canvas");
    const scale = layer === "near" ? 9 : layer === "mid" ? 7 : 5;
    const side = Math.max(18, Math.ceil(size * scale));
    canvas.width = side;
    canvas.height = side;
    const ctx = canvas.getContext("2d");
    const center = side / 2;
    const gradient = ctx.createRadialGradient(center, center, 0, center, center, center);
    gradient.addColorStop(0, "#ffffff");
    gradient.addColorStop(0.18, color);
    gradient.addColorStop(0.48, `${color}66`);
    gradient.addColorStop(1, "#00000000");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, side, side);
    this.spriteCache.set(key, canvas);
    return canvas;
  }

  drawStructure(ctx) {
    const { behavior, accent } = this.preset;
    const cx = this.width / 2, cy = this.height / 2;
    ctx.strokeStyle = accent;
    ctx.globalAlpha = 0.16 * this.effectScale;
    ctx.lineWidth = 0.65;
    if (behavior === "tree") {
      this.drawCosmicTree(ctx, cx, cy, accent);
    } else if (behavior === "neural") {
      for (let i = 0; i < this.quality.links; i += 1) {
        const a = this.particles[(i * 17) % this.particles.length];
        const b = this.particles[(i * 43 + 11) % this.particles.length];
        if (Math.hypot(a.x - b.x, a.y - b.y) < 190) {
          ctx.globalAlpha = (0.08 + (Math.sin(this.time * 2 + i) > 0.94 ? 0.22 : 0)) * this.effectScale;
          this.line(ctx, a.x, a.y, b.x, b.y);
        }
      }
    } else if (behavior === "reactor") {
      this.drawReactor(ctx, cx, cy, accent);
    } else if (behavior === "tesseract") {
      this.drawTesseract(ctx, cx, cy, accent);
    } else if (behavior === "vortex") {
      this.drawBlackHole(ctx, cx, cy, accent);
    } else if (behavior === "ultimate") {
      this.drawUltimateOrbits(ctx, cx, cy, accent);
    }
  }

  drawCosmicTree(ctx, cx, cy, accent) {
    ctx.save();
    ctx.strokeStyle = accent;
    ctx.shadowColor = accent;
    ctx.shadowBlur = 18 * this.effectScale;
    for (let i = 0; i < 11; i += 1) {
      const side = i - 5;
      ctx.globalAlpha = (0.08 + (5 - Math.abs(side)) * 0.014) * this.effectScale;
      ctx.lineWidth = 1 + (5 - Math.abs(side)) * 0.35;
      ctx.beginPath();
      ctx.moveTo(cx, cy + this.height * 0.46);
      ctx.bezierCurveTo(cx + side * 18 + Math.sin(this.time + i) * 18, cy + 190, cx + side * 42 + Math.cos(this.time * 0.7 + i) * 60, cy - 60, cx + side * 86, cy - 270);
      ctx.stroke();
    }
    for (let i = 0; i < 9; i += 1) {
      const x = cx + (i - 4) * 42;
      ctx.globalAlpha = 0.09 * this.effectScale;
      ctx.beginPath();
      ctx.moveTo(cx, cy + 40);
      ctx.bezierCurveTo(cx + (i - 4) * 36, cy + 190, x, cy + 360, x + Math.sin(this.time + i) * 60, cy + this.height);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawBlackHole(ctx, cx, cy, accent) {
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.strokeStyle = accent;
    ctx.shadowColor = accent;
    ctx.shadowBlur = 26 * this.effectScale;
    for (let r = 56; r < 340; r += 32) {
      ctx.globalAlpha = Math.max(0.035, 0.17 - r / 2600) * this.effectScale;
      ctx.lineWidth = r < 110 ? 2.8 : 1.2;
      ctx.beginPath();
      ctx.ellipse(cx, cy, r * (1 + Math.sin(this.time + r) * 0.018), r * 0.34, this.rotation * 0.6, 0, TAU);
      ctx.stroke();
    }
    const lens = ctx.createRadialGradient(cx, cy, 28, cx, cy, 180);
    lens.addColorStop(0, "#000000");
    lens.addColorStop(0.32, "#000000");
    lens.addColorStop(0.42, `${accent}36`);
    lens.addColorStop(0.62, `${accent}10`);
    lens.addColorStop(1, "#00000000");
    ctx.globalAlpha = 1;
    ctx.fillStyle = lens;
    ctx.beginPath();
    ctx.arc(cx, cy, 180, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  drawReactor(ctx, cx, cy, accent) {
    ctx.save();
    ctx.strokeStyle = accent;
    ctx.shadowColor = accent;
    ctx.shadowBlur = 20 * this.effectScale;
    for (let r = 44; r < 310; r += 30) {
      ctx.globalAlpha = (0.18 + Math.sin(this.time * 3 - r * 0.04) * 0.05) * this.effectScale;
      ctx.lineWidth = r % 60 === 0 ? 2.2 : 0.85;
      ctx.beginPath();
      ctx.arc(cx, cy, r * (this.coreScale + this.ringPulse * 0.12), 0, TAU);
      ctx.stroke();
    }
    for (let i = 0; i < 12; i += 1) {
      const angle = i * TAU / 12 + this.rotation * 1.8;
      const inner = 66 + Math.sin(this.time * 4 + i) * 8;
      const outer = 260 + Math.cos(this.time * 2 + i) * 18;
      ctx.globalAlpha = 0.16 * this.effectScale;
      this.line(ctx, cx + Math.cos(angle) * inner, cy + Math.sin(angle) * inner, cx + Math.cos(angle) * outer, cy + Math.sin(angle) * outer);
    }
    ctx.restore();
  }

  drawTesseract(ctx, cx, cy, accent) {
    ctx.save();
    ctx.strokeStyle = accent;
    ctx.shadowColor = accent;
    ctx.shadowBlur = 16 * this.effectScale;
    const points = this.particles.slice(0, 48);
    for (let i = 0; i < points.length; i += 1) {
      const b = points[(i + 4) % points.length];
      const c = points[(i + 12) % points.length];
      ctx.globalAlpha = 0.11 * this.effectScale;
      this.line(ctx, points[i].x, points[i].y, b.x, b.y);
      ctx.globalAlpha = 0.055 * this.effectScale;
      this.line(ctx, points[i].x, points[i].y, c.x, c.y);
    }
    for (let r = 120; r <= 310; r += 70) {
      ctx.globalAlpha = 0.06 * this.effectScale;
      ctx.beginPath();
      ctx.rect(cx - r / 2, cy - r / 2, r, r);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawUltimateOrbits(ctx, cx, cy, accent) {
    const labels = ["WORLD TREE", "BLACK HOLE", "ARC", "NEURAL", "TESSERACT"];
    ctx.save();
    ctx.globalAlpha = 0.22 * this.effectScale;
    ctx.strokeStyle = accent;
    for (let r = 88; r <= 308; r += 44) {
      ctx.beginPath();
      ctx.arc(cx, cy, r * (0.96 + this.ultimatePulse * 0.05), 0, TAU);
      ctx.stroke();
    }
    ctx.globalAlpha = 0.5 * this.effectScale;
    ctx.fillStyle = accent;
    ctx.shadowColor = accent;
    ctx.shadowBlur = 18 * this.effectScale;
    ctx.beginPath();
    ctx.arc(cx, cy, 22 + this.ultimatePulse * 10, 0, TAU);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.font = "7px Segoe UI, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (let i = 0; i < labels.length; i += 1) {
      const angle = this.rotation * 0.62 + i * TAU / labels.length;
      const radius = 152 + i * 27;
      const x = cx + Math.cos(angle) * radius;
      const y = cy + Math.sin(angle) * radius * 0.72;
      ctx.globalAlpha = 0.62 * this.effectScale;
      ctx.beginPath();
      ctx.arc(x, y, 6 + this.ultimatePulse * 3, 0, TAU);
      ctx.fill();
      ctx.globalAlpha = 0.42 * this.effectScale;
      ctx.fillText(labels[i], x, y - 13);
    }
    ctx.restore();
  }

  line(ctx, x1, y1, x2, y2) {
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  }
}
