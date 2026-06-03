# Particle Multiverse OS Ultimate Edition v2.0

Particle Multiverse OS Ultimate Edition v2.0 is the World Tree Remaster development-line release. It preserves the complete v1.0 baseline and adds a dedicated Ultimate Edition identity layer across the desktop app, HUD, Dashboard, and Mission Control.

## Branch And Version Policy

- Protected baseline: `v1.0`
- Development branch: `develop`
- Release tag: `v2.0`
- Main branch policy: `main` is not used for Ultimate Edition feature work.

## Highlights

- Preserves all v1.0 particle worlds, interactions, release assets, local privacy rules, and Tauri packaging.
- Adds `src/ultimate-edition.js` as the v2.0 identity layer.
- Shows Ultimate Edition metadata in the title, topbar, HUD, Dashboard, Mission Control, and footer.
- Updates npm and Tauri versions to `2.0.0`.
- Keeps history intact without rewriting `main` or the `v1.0` tag.

## Install

```bash
npm install
npm run dev
npm run tauri dev
npm run tauri build
```

## Privacy

Ultimate Edition keeps the local-first privacy boundary: no private-file scanning, no browser-history scanning, and no cloud upload.
