const TAU = Math.PI * 2;

export const WORLD_PRESETS = [
  {
    id: "world-tree", name: "COSMIC WORLD TREE", subtitle: "INFINITE ROOT SYSTEM",
    description: "An infinite cosmic tree with roots falling through deep space.", colors: ["#5fffd2", "#9cff6b", "#e4fff8", "#b7fffb"],
    accent: "#66ffd3", behavior: "tree", interaction: "GROWTH FIELD", speed: 0.85,
  },
  {
    id: "black-hole", name: "GARGANTUA WELL", subtitle: "GRAVITATIONAL LENS",
    description: "A cinematic black hole bending light into a living accretion disk.", colors: ["#ba68ff", "#ff6cab", "#ffc3f3", "#ffcf8a"],
    accent: "#b66dff", behavior: "vortex", interaction: "GRAVITY WELL", speed: 1.25,
  },
  {
    id: "arc-reactor", name: "ARC REACTOR", subtitle: "MARK 85 PLASMA CORE",
    description: "Electric rings and pulse waves fold into a clean energy star.", colors: ["#68eaff", "#8fb4ff", "#ffffff", "#bfffff"],
    accent: "#5deaff", behavior: "reactor", interaction: "PLASMA CHARGE", speed: 1.45,
  },
  {
    id: "neural-brain", name: "NEURAL BRAIN", subtitle: "ELECTRIC CORTEX",
    description: "Neurons fire through a luminous brain-scale signal mesh.", colors: ["#ff71d7", "#8c7bff", "#ffbded", "#77f7ff"],
    accent: "#f16ed8", behavior: "neural", interaction: "SYNAPTIC FOCUS", speed: 0.95,
  },
  {
    id: "tesseract", name: "TESSERACT", subtitle: "FOURTH DIMENSION",
    description: "A rotating hypercube folds space through layered dimensions.", colors: ["#5ea8ff", "#8a7dff", "#bbd7ff", "#f2fbff"],
    accent: "#718dff", behavior: "tesseract", interaction: "DIMENSION SHIFT", speed: 1.05,
  },
  {
    id: "ultimate", name: "MULTIVERSE CORE", subtitle: "FIVE WORLDS IN ORBIT",
    description: "Five universes orbit a central core in a final cosmic engine.", colors: ["#73fff2", "#9d79ff", "#ff7fcf", "#ffe58e", "#68eaff"],
    accent: "#a884ff", behavior: "ultimate", interaction: "REALITY WARP", speed: 1.3,
  },
];

const noise = (seed) => {
  const value = Math.sin(seed * 91.73) * 43758.5453;
  return value - Math.floor(value);
};

export function positionParticle(p, i, count, preset, width, height) {
  const cx = width / 2;
  const cy = height / 2;
  const n1 = noise(i + 1);
  const n2 = noise(i + 16);
  const n3 = noise(i + 73);
  const angle = n1 * TAU;
  const radius = Math.sqrt(n2) * Math.min(width, height) * 0.38;
  p.seed = n1 * 100;
  p.phase = n2 * TAU;
  p.depth = n3;
  p.layer = n3 > 0.76 ? "near" : n3 > 0.34 ? "mid" : "far";
  p.z = p.layer === "near" ? 1.28 + n3 * 0.42 : p.layer === "mid" ? 0.82 + n3 * 0.32 : 0.34 + n3 * 0.34;
  p.parallax = p.layer === "near" ? 1.24 : p.layer === "mid" ? 0.72 : 0.32;
  p.life = n1;
  p.size = (0.55 + n3 * 1.8) * p.z;
  p.color = preset.colors[i % preset.colors.length];

  if (preset.behavior === "tree") {
    const root = i < count * 0.32;
    const trunk = !root && i < count * 0.54;
    const branch = Math.floor(n1 * 13) - 6;
    const rootFall = cy + 20 + n2 * height * 0.92;
    const crownY = cy + 120 - n2 * height * 0.82;
    const spread = root ? (n2 * n2) * 110 : trunk ? (1 - n2) * 42 : (1 - n2) * (120 + Math.abs(branch) * 58);
    p.x = cx + (root ? (n3 - 0.5) * spread : trunk ? (n3 - 0.5) * spread : branch * spread * 0.42 + (n3 - 0.5) * 90);
    p.y = root ? rootFall : crownY;
    p.flow = root ? -1 : 1;
  } else if (preset.behavior === "vortex") {
    const lens = 0.34 + n3 * 0.2;
    const diskRadius = 36 + Math.pow(n2, 0.72) * Math.min(width, height) * 0.48;
    p.x = cx + Math.cos(angle) * diskRadius;
    p.y = cy + Math.sin(angle) * diskRadius * lens;
    p.orbit = diskRadius + 20;
    p.infall = 0.4 + n1 * 0.9;
  } else if (preset.behavior === "reactor") {
    const ring = 48 + (i % 11) * 25 + n3 * 18;
    p.x = cx + Math.cos(angle) * ring;
    p.y = cy + Math.sin(angle) * ring;
    p.orbit = ring;
    p.arc = i % 17 === 0;
  } else if (preset.behavior === "neural") {
    const brain = Math.sin(angle) * Math.sin(angle * 0.5) * 0.18;
    p.x = cx + Math.cos(angle) * (260 + n2 * 240) * (1 + brain);
    p.y = cy + Math.sin(angle) * (120 + n3 * 170) + Math.cos(angle * 2) * 42;
    p.signal = n1;
  } else if (preset.behavior === "tesseract") {
    const layer = i % 3 === 0 ? 1 : i % 3 === 1 ? 0.68 : 0.42;
    const edge = i % 4;
    const along = n1 * 2 - 1;
    p.x = cx + (edge < 2 ? along : edge === 2 ? -1 : 1) * 260 * layer;
    p.y = cy + (edge >= 2 ? along : edge === 0 ? -1 : 1) * 260 * layer;
    p.hyper = layer;
  } else {
    const world = i % 5;
    const baseOrbit = 112 + world * 54 + n3 * 42;
    const local = n1 * TAU * 3 + radius * 0.01;
    const worldAngle = world * TAU / 5;
    const wx = Math.cos(worldAngle) * baseOrbit;
    const wy = Math.sin(worldAngle) * baseOrbit * 0.62;
    p.x = cx + wx + Math.cos(local) * (18 + n2 * 46);
    p.y = cy + wy + Math.sin(local) * (14 + n3 * 38);
    p.orbit = baseOrbit;
    p.world = world;
  }
  p.baseX = p.x;
  p.baseY = p.y;
  p.vx = (n3 - 0.5) * 0.24;
  p.vy = (n1 - 0.5) * 0.24;
}
