export class CameraLayer {
  constructor(bus, video, preview) {
    this.bus = bus;
    this.video = video;
    this.preview = preview;
    this.stream = null;
    this.starting = false;
  }

  async toggle() {
    if (this.starting) return;
    if (this.stream) {
      this.stop();
      return;
    }

    await this.start();
  }

  async start() {
    if (this.stream || this.starting) return;

    this.starting = true;
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        const error = new Error("Camera API unavailable");
        error.name = "NotSupportedError";
        throw error;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          width: { ideal: 640 },
          height: { ideal: 360 },
          facingMode: "user",
          frameRate: { ideal: 24, max: 24 },
        },
      });

      this.stream = stream;
      this.video.srcObject = stream;
      await this.video.play();
      this.showPreview();
      console.info("Camera started");
      this.bus.emit("CAMERA_STARTED", { stream, video: this.video, state: "ONLINE" });
    } catch (error) {
      const state = this.classifyError(error);
      this.releaseTracks();
      this.video.srcObject = null;
      this.hidePreview();
      console.error(`Camera error: ${state}`, error);
      this.bus.emit("CAMERA_ERROR", { state, error });
    } finally {
      this.starting = false;
    }
  }

  stop() {
    this.releaseTracks();
    this.video.srcObject = null;
    this.hidePreview();
    console.info("Camera stopped");
    this.bus.emit("CAMERA_STOPPED", { state: "OFF" });
  }

  fail() {
    this.releaseTracks();
    this.video.srcObject = null;
    this.hidePreview();
  }

  releaseTracks() {
    this.stream?.getTracks().forEach((track) => track.stop());
    this.stream = null;
  }

  showPreview() {
    if (!this.stream) return;
    this.preview.classList.remove("hidden");
  }

  hidePreview() {
    this.preview.classList.add("hidden");
  }

  classifyError(error) {
    if (error?.name === "NotAllowedError" || error?.name === "SecurityError") {
      return "PERMISSION DENIED";
    }
    if (error?.name === "NotReadableError" || error?.name === "AbortError") {
      return "BUSY";
    }
    return "ERROR";
  }
}
