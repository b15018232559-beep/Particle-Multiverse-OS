export class VoiceCommander {
  constructor(bus, router, recognitionFactory = null) {
    this.bus = bus;
    this.router = router;
    this.enabled = false;
    this.listening = false;
    this.recognition = null;
    const Recognition = recognitionFactory ?? globalThis.SpeechRecognition ?? globalThis.webkitSpeechRecognition;
    this.supported = Boolean(Recognition);
    if (this.supported) this.configure(new Recognition());
    this.emitState();
  }

  configure(recognition) {
    this.recognition = recognition;
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = "zh-CN";
    recognition.onstart = () => { this.listening = true; this.emitState(); };
    recognition.onend = () => {
      this.listening = false;
      this.emitState();
      if (this.enabled) this.start();
    };
    recognition.onerror = (event) => {
      this.enabled = false;
      this.listening = false;
      this.bus.emit("VOICE_ERROR", { state: (event.error ?? "ERROR").toUpperCase() });
      this.emitState();
    };
    recognition.onresult = (event) => {
      const result = event.results[event.results.length - 1][0];
      this.router.routeText(result.transcript, result.confidence ?? 1);
    };
  }

  toggle() {
    if (!this.supported) {
      this.bus.emit("VOICE_ERROR", { state: "VOICE NOT SUPPORTED" });
      this.emitState();
      return false;
    }
    this.enabled ? this.stop() : this.start();
    return true;
  }

  start() {
    if (!this.supported || this.listening) return;
    this.enabled = true;
    try { this.recognition.start(); } catch { this.emitState(); }
  }

  stop() {
    this.enabled = false;
    if (this.listening) this.recognition.stop();
    this.listening = false;
    this.emitState();
  }

  emitState() {
    this.bus.emit("VOICE_STATE_CHANGED", {
      supported: this.supported,
      enabled: this.enabled,
      listening: this.listening,
      state: this.supported ? (this.enabled ? "ON" : "OFF") : "VOICE NOT SUPPORTED",
    });
  }
}
