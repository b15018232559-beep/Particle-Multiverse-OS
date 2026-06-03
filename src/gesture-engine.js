import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";

const ACTIVE_GESTURES = new Set(["OPEN_HAND", "FIST", "POINT", "PINCH"]);
const DYNAMIC_GESTURES = new Set(["SWIPE_LEFT", "SWIPE_RIGHT"]);
const COOLDOWNS = {
  SWIPE_LEFT: 1000,
  SWIPE_RIGHT: 1000,
  DOUBLE_OPEN: 2000,
  DOUBLE_FIST: 1000,
};

export class GestureEngine {
  constructor(bus, fpsGetter = () => 60) {
    this.bus = bus;
    this.fpsGetter = fpsGetter;
    this.landmarker = null;
    this.video = null;
    this.running = false;
    this.timer = null;
    this.handVisible = false;
    this.missingFrames = 0;
    this.lastNoHandLog = 0;
    this.lastGesture = "NONE";
    this.lastEmit = 0;
    this.lastPoint = { x: 0.5, y: 0.5 };
    this.wristHistory = [];
    this.spanHistory = [];
    this.cooldowns = new Map();
    this.candidate = "NONE";
    this.candidateFrames = 0;
  }

  async start(video) {
    this.stop();
    this.video = video;
    this.running = true;

    try {
      await this.initialize();
      this.schedule(0);
    } catch (error) {
      this.running = false;
      console.error("Gesture engine error", error);
      this.bus.emit("CAMERA_ERROR", { state: "ERROR", error });
    }
  }

  stop() {
    this.running = false;
    clearTimeout(this.timer);
    this.timer = null;
    this.video = null;
    this.resetMotion();
    this.updateHandState(false, true);
    this.emitGesture({ type: "NONE", x: 0.5, y: 0.5, confidence: 0, hands: 0 }, true);
  }

  async initialize() {
    if (this.landmarker) return;

    const base = import.meta.env.BASE_URL;
    const vision = await FilesetResolver.forVisionTasks(`${base}mediapipe/wasm`);
    this.landmarker = await HandLandmarker.createFromOptions(vision, {
      baseOptions: { modelAssetPath: `${base}mediapipe/hand_landmarker.task` },
      runningMode: "VIDEO",
      numHands: 2,
      minHandDetectionConfidence: 0.55,
      minHandPresenceConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });
  }

  schedule(delay = this.interval()) {
    clearTimeout(this.timer);
    if (!this.running) return;
    this.timer = setTimeout(() => this.tick(), delay);
  }

  tick() {
    if (!this.running) return;

    try {
      if (this.video?.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
        this.process(this.landmarker.detectForVideo(this.video, performance.now()));
      }
    } catch (error) {
      console.error("Gesture recognition error", error);
    }

    this.schedule();
  }

  interval() {
    return 1000 / (this.fpsGetter() < 30 ? 15 : 22);
  }

  process(results) {
    const hands = results.landmarks ?? [];
    if (!hands.length) {
      this.updateHandState(false);
      return;
    }

    this.updateHandState(true, false, hands.length);
    const confidence = Math.min(...hands.map((_, index) => results.handednesses?.[index]?.[0]?.score ?? 0.75));
    let point = this.mirror(hands[0][8]);
    let type;
    let strength = 1;

    if (hands.length >= 2) {
      const dual = this.detectTwoHandGesture(hands);
      type = dual.type;
      strength = dual.strength;
      point = { x: dual.x, y: dual.y };
    } else {
      this.spanHistory = [];
      type = this.detectSingleHandGesture(hands[0]);
    }

    this.acceptGesture({ type, ...point, confidence, hands: hands.length, strength });
  }

  detectSingleHandGesture(landmarks) {
    if (this.isPinch(landmarks)) return "PINCH";
    const swipe = this.detectSwipe(this.mirror(landmarks[0]).x);
    if (swipe) return swipe;
    const base = this.classify(landmarks);
    return base;
  }

  detectTwoHandGesture(hands) {
    this.wristHistory = [];
    const left = this.mirror(hands[0][0]);
    const right = this.mirror(hands[1][0]);
    const span = Math.hypot(left.x - right.x, left.y - right.y);
    const center = { x: (left.x + right.x) / 2, y: (left.y + right.y) / 2 };
    const types = hands.map((hand) => this.classify(hand));
    if (span > 0.16 && types.every((type) => type === "OPEN_HAND")) return { type: "DOUBLE_OPEN", strength: 1, ...center };
    if (types.every((type) => type === "FIST")) return { type: "DOUBLE_FIST", strength: 1, ...center };
    return { type: "NONE", strength: 0, ...center };
  }

  classify(landmarks) {
    const extended = [8, 12, 16, 20].map((tip) => landmarks[tip].y < landmarks[tip - 2].y);
    const [index, middle, ring, pinky] = extended;
    const thumb = Math.abs(landmarks[4].x - landmarks[9].x) > Math.abs(landmarks[3].x - landmarks[9].x) * 1.12;
    const count = extended.filter(Boolean).length + Number(thumb);

    if (index && !middle && !ring && !pinky) return "POINT";
    if (count >= 4) return "OPEN_HAND";
    if (count <= 1) return "FIST";
    return "NONE";
  }

  isPinch(landmarks) {
    const pinchDistance = Math.hypot(landmarks[4].x - landmarks[8].x, landmarks[4].y - landmarks[8].y);
    const palmSize = Math.max(0.04, Math.hypot(landmarks[0].x - landmarks[9].x, landmarks[0].y - landmarks[9].y));
    return pinchDistance / palmSize < 0.38;
  }

  detectSwipe(wristX) {
    const now = performance.now();
    this.wristHistory.push({ x: wristX, time: now });
    this.wristHistory = this.wristHistory.filter((sample) => now - sample.time < 450);
    if (this.wristHistory.length < 3) return null;

    const delta = wristX - this.wristHistory[0].x;
    if (Math.abs(delta) < 0.18) return null;

    this.wristHistory = [];
    return delta > 0 ? "SWIPE_RIGHT" : "SWIPE_LEFT";
  }

  acceptGesture(payload) {
    const { type } = payload;
    if (DYNAMIC_GESTURES.has(type)) {
      if (this.isCoolingDown(type)) return;
      this.cooldown(type);
      this.emitGesture(payload, true);
      return;
    }

    if (type !== this.candidate) {
      this.candidate = type;
      this.candidateFrames = 1;
      return;
    }

    this.candidateFrames += 1;
    const requiredFrames = type === "DOUBLE_OPEN" || type === "DOUBLE_FIST" ? 3 : 2;
    if (this.candidateFrames < requiredFrames || this.isCoolingDown(type)) return;
    if (type === "DOUBLE_OPEN" || type === "DOUBLE_FIST") this.cooldown(type);
    this.emitGesture(payload);
  }

  isCoolingDown(type) {
    return performance.now() < (this.cooldowns.get(type) ?? 0);
  }

  cooldown(type) {
    this.cooldowns.set(type, performance.now() + (COOLDOWNS[type] ?? 0));
  }

  updateHandState(visible, immediate = false, hands = 1) {
    if (visible) {
      this.missingFrames = 0;
      if (!this.handVisible) {
        this.handVisible = true;
        console.info("Hand detected");
        this.bus.emit("HAND_DETECTED", { type: this.lastGesture, ...this.lastPoint, confidence: 0, hands });
      }
      return;
    }

    this.missingFrames += 1;
    const now = performance.now();
    if (this.running && now - this.lastNoHandLog > 2500) {
      console.info("Camera online but no hand landmarks detected");
      this.lastNoHandLog = now;
    }

    if (this.handVisible && (immediate || this.missingFrames >= 3)) {
      this.handVisible = false;
      console.info("Hand lost");
      this.bus.emit("HAND_LOST", { type: "NONE", ...this.lastPoint, confidence: 0, hands: 0 });
      this.emitGesture({ type: "NONE", x: 0.5, y: 0.5, confidence: 0, hands: 0 }, true);
    }
  }

  emitGesture(payload, force = false) {
    const now = performance.now();
    const moved = Math.hypot(payload.x - this.lastPoint.x, payload.y - this.lastPoint.y) > 0.015;
    const changed = payload.type !== this.lastGesture;
    const refresh = ACTIVE_GESTURES.has(payload.type) && now - this.lastEmit > 180;
    if (!force && !changed && !(payload.type === "POINT" && moved) && !refresh) return;

    this.lastGesture = payload.type;
    this.lastPoint = { x: payload.x, y: payload.y };
    this.lastEmit = now;
    if (payload.type !== "NONE") console.info(`Gesture detected: ${payload.type}`);
    this.bus.emit("GESTURE_CHANGED", payload);
  }

  mirror(point) {
    return { x: 1 - point.x, y: point.y };
  }

  resetMotion() {
    this.wristHistory = [];
    this.spanHistory = [];
    this.candidate = "NONE";
    this.candidateFrames = 0;
  }
}
