export class MusicController {
  constructor(bus, analyzer, audio, fileInput, dropTarget, router = null) {
    this.bus = bus;
    this.analyzer = analyzer;
    this.audio = audio;
    this.fileInput = fileInput;
    this.dropTarget = dropTarget;
    this.router = router;
    const base = import.meta.env?.BASE_URL ?? "/";
    this.playlist = [{ name: "MULTIVERSE AMBIENCE", url: `${base}bg.mp3`, objectUrl: false }];
    this.index = 0;
    this.mode = false;
    this.bound = false;
    this.load(0);
  }

  bind() {
    if (this.bound) return;
    this.bound = true;
    this.fileInput.addEventListener("change", () => this.importFiles(this.fileInput.files));
    this.dropTarget.addEventListener("dragover", (event) => {
      event.preventDefault();
      this.dropTarget.classList.add("dragging");
    });
    this.dropTarget.addEventListener("dragleave", () => this.dropTarget.classList.remove("dragging"));
    this.dropTarget.addEventListener("drop", (event) => {
      event.preventDefault();
      this.dropTarget.classList.remove("dragging");
      this.importFiles(event.dataTransfer.files);
    });
    this.audio.addEventListener("play", () => this.bus.emit("MUSIC_STATE_CHANGED", this.state("PLAYING")));
    this.audio.addEventListener("pause", () => {
      this.analyzer.stop();
      this.bus.emit("MUSIC_STATE_CHANGED", this.state("PAUSED"));
    });
    this.audio.addEventListener("ended", () => this.next());
    document.getElementById("music-play").addEventListener("click", () => this.route("toggleMusic", "button", () => this.togglePlayback()));
    document.getElementById("music-next").addEventListener("click", () => this.next());
    document.getElementById("music-previous").addEventListener("click", () => this.previous());
    document.getElementById("music-import").addEventListener("click", () => this.openPicker());
    document.getElementById("music-mode").addEventListener("click", () => this.toggleMode());
    window.addEventListener("keydown", (event) => {
      if (event.ctrlKey || ["INPUT", "TEXTAREA"].includes(event.target?.tagName)) return;
      if (event.key === "m" || event.key === "M") this.route("toggleMusic", "keyboard", () => this.togglePlayback());
      if (event.key === "n" || event.key === "N") this.next();
      if (event.key === "b" || event.key === "B") this.previous();
    });
  }

  route(action, source, fallback) {
    if (!this.router?.dispatch(action, {}, source)) fallback();
  }

  async togglePlayback() {
    try {
      if (this.audio.paused) {
        await this.playCurrent();
      } else {
        this.audio.pause();
      }
    } catch (error) {
      console.error("Music playback error", error);
      this.bus.emit("MUSIC_STATE_CHANGED", this.state("ERROR"));
    }
  }

  toggleMode() {
    this.setMode(!this.mode);
  }

  setMode(enabled) {
    if (this.mode === enabled) return;
    this.mode = enabled;
    console.info(`Music mode: ${this.mode ? "ON" : "OFF"}`);
    this.bus.emit("MUSIC_MODE_CHANGED", { enabled: this.mode });
  }

  next() {
    const wasPlaying = !this.audio.paused;
    this.load((this.index + 1) % this.playlist.length);
    if (wasPlaying) this.playCurrent().catch((error) => this.handlePlaybackError(error));
  }

  previous() {
    const wasPlaying = !this.audio.paused;
    this.load((this.index - 1 + this.playlist.length) % this.playlist.length);
    if (wasPlaying) this.playCurrent().catch((error) => this.handlePlaybackError(error));
  }

  async playCurrent() {
    const analyzing = this.analyzer.connect(this.audio);
    await this.audio.play();
    if (analyzing) await this.analyzer.resume();
  }

  handlePlaybackError(error) {
    console.error("Music playback error", error);
    this.bus.emit("MUSIC_STATE_CHANGED", this.state("ERROR"));
  }

  load(index) {
    this.index = index;
    const track = this.playlist[this.index];
    this.audio.src = track.url;
    this.audio.loop = this.playlist.length === 1;
    this.audio.load();
    this.bus.emit("MUSIC_TRACK_CHANGED", this.state("READY"));
  }

  importFiles(fileList) {
    const files = [...fileList].filter((file) => file.type.startsWith("audio/"));
    if (!files.length) return;
    for (const file of files) {
      this.playlist.push({ name: file.name, url: URL.createObjectURL(file), objectUrl: true });
    }
    this.load(this.playlist.length - files.length);
    this.bus.emit("MUSIC_IMPORTED", { count: files.length });
  }

  openPicker() {
    this.fileInput.click();
  }

  state(status) {
    return { status, name: this.playlist[this.index].name, index: this.index, total: this.playlist.length };
  }
}
