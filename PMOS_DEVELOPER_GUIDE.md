# PMOS Developer Guide

## Entry Points

- `src/main.js`: wires the app.
- `src/command-center.js`: unified command dispatch layer.
- `src/mission-control.js`: V10 Mission Control overlay.
- `src/particle-engine.js`: particle rendering and Ultimate orbit drawing.
- `src/workspace-memory.js`: local Workspace OS persistence.
- `src/multi-agent-manager.js`: Agent Team task pipeline.

## Test Commands

```bash
node work/v2-smoke.mjs
node work/v25-smoke.mjs
node work/v3-smoke.mjs
node work/v4-smoke.mjs
node work/v5-smoke.mjs
node work/v6-smoke.mjs
node work/v7-smoke.mjs
node work/v8-smoke.mjs
node work/v9-smoke.mjs
node work/v10-smoke.mjs
npm run build
```

## Rules

- Keep one `requestAnimationFrame` loop.
- Route commands through Command Center / Command Router.
- Keep Mission Control and Dashboard rendering throttled.
- Keep data local unless a future release explicitly adds online behavior.
- Do not add placeholder buttons.

## Packaging

```bash
npm run tauri build
```

The NSIS installer and portable executable are copied into `outputs/` during release preparation.
