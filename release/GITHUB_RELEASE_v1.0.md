# Particle Multiverse OS v1.0

Particle Multiverse OS is a cinematic desktop particle universe built with Tauri, Vite, and modular JavaScript systems. This release packages the current stable portfolio build for GitHub distribution.

## Highlights

- Six cinematic particle worlds with distinct colors, movement models, and interactions.
- Smooth world switching through buttons, keyboard arrows, wheel, touchpad, and voice commands.
- Shockwave burst system through Space, double click, and UI controls.
- Glassmorphism HUD, dashboard, system health, plugin center, workspace memory, agent layer, multi-agent team, and mission control.
- Local-first design: no data upload, no browser history scan, and no private-file scanning.
- Windows desktop build through Tauri with fullscreen support.

## Download Assets

Upload these files to the GitHub Release:

- `Particle-Multiverse-OS-Setup.exe`
- `Particle-Multiverse-OS-Portable.exe`
- `FINAL_RELEASE_REPORT.md`
- `APP_READINESS_REPORT.md`
- `INSTALL_GUIDE.md`

## Install

1. Download `Particle-Multiverse-OS-Setup.exe`.
2. Run the installer.
3. Start Particle Multiverse OS from the Start Menu or desktop shortcut.

Portable option:

1. Download `Particle-Multiverse-OS-Portable.exe`.
2. Run it directly without installation.

## Developer Run

```bash
npm install
npm run dev
npm run tauri dev
npm run tauri build
```

## Known Notes

- Windows SmartScreen may warn because this build is unsigned.
- Camera and microphone features require explicit local permission when used.
- WebGL2 is preferred; Canvas rendering is used as a fallback where needed.

## Privacy

All runtime state is local. The app does not upload workspace memory, agent history, voice state, or user interaction data.
