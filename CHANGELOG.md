# Changelog

## v1.0.0 GitHub Release - 2026-06-03

- Prepared Particle Multiverse OS for GitHub open-source portfolio release.
- Added professional README with project overview, feature showcase, tech stack, install instructions, controls, and privacy notes.
- Added MIT license.
- Added GitHub Release draft for `v1.0`.
- Organized release assets and screenshots for public distribution.
- Preserved all existing V1-V10 runtime functionality without adding new product features.

## 10.0.2 - 2026-06-03

- Upgraded the visual system without adding pages, buttons, agents, dashboards, or plugins.
- Raised particle density to LOW 3000, MEDIUM 8000, HIGH 15000, and ULTRA 30000.
- Added a WebGL2 instanced particle layer with automatic Canvas sprite fallback.
- Added near, mid, and far particle depth layers for stronger spatial depth.
- Reworked world visuals: Cosmic World Tree, Gargantua-style black hole, Mark 85-style ARC Reactor, electric Neural Brain, rotating Tesseract, and Multiverse Core.
- Added cinematic atmosphere: volumetric fog, god-ray style light shafts, HDR glow, bloom pass, trails, camera drift, breathing zoom, and depth movement.
- Reused the existing fullscreen control and F11 for Cinematic Mode UI hiding.
- Preserved existing interaction, camera, hand gestures, music, Dashboard, agents, Mission Control, and Tauri packaging.

## 10.0.1 - 2026-06-03

- Improved voice command routing with five clear categories: page, scene, particle, music, and system.
- Added Chinese and English command aliases, including similar phrases such as open, enter, and switch.
- Added voice confidence filtering at `0.65`, one-second duplicate-command cooldown, and explicit HUD feedback for unrecognized or uncertain commands.
- Simplified camera gestures to stable commands only: `OPEN_HAND`, `FIST`, `POINT`, `SWIPE_LEFT`, `SWIPE_RIGHT`, `PINCH`, `DOUBLE_OPEN`, and `DOUBLE_FIST`.
- Added one-second page-swipe cooldown and two-second `DOUBLE_OPEN` burst cooldown.
- Added Command Help panel opened by `HELP / COMMAND`, `?`, or the voice command `显示指令`.
- Added `COMMAND_GUIDE.md`.
- Preserved existing particles, scenes, camera, music, Dashboard, agents, Mission Control, and Tauri packaging.

## 10.0.0 - 2026-06-03

- Added V10 Mission Control with `Tab`, showing worlds, agents, tasks, plugins, workspaces, and system status.
- Added `command-center.js` as the unified command dispatch layer for keyboard, voice, gesture, Dashboard, and Mission Control actions.
- Added Research Workspace and exposed Workspace OS state to Mission Control.
- Upgraded Dashboard into System Command Center with Agent, Team, Task, Memory, and Performance metrics.
- Upgraded System Health Pro with Agent, Voice, Memory, and failed-task monitoring.
- Upgraded Ultimate Scene with central core and Worlds, Agent, Memory, Task, Plugin, and Voice orbits.
- Added final product documents: PMOS architecture, user guide, developer guide, install guide, release notes, and version file.
- Preserved all V1-V9 functionality and the single particle render loop.

## 9.0.0 - 2026-06-03

- Added local Multi-Agent System with Coordinator, Planner, Executor, Reviewer, and Memory agents.
- Added `multi-agent-manager.js`, `task-board.js`, and the `src/multi-agent/` team-agent modules.
- Added Dashboard Multi Agent Center with Agent Team, Task Flow, Task Board, and Recent Agent Discussion.
- Added task lifecycle events, review events, memory-load events, discussion history, task status grouping, and error isolation.
- Added Context linkage for Coding, Study, and Performance Save modes.
- Added Workspace Memory records for task history, agent history, discussion history, and team usage.
- Added bilingual voice commands for task creation, collaboration start/stop, Task Board, and Agent status.
- Preserved all V1-V8 functionality and the single particle render loop.

## 8.0.0 - 2026-06-03

- Added local AI Agent Layer with Study, Coding, Research, and Automation assistants.
- Added Agent Manager registration, lifecycle, suggestion collection, throttling, dismiss cooldown, and error isolation.
- Added collapsed Dashboard Agent Center with status, suggestion, accept, ignore, and close-all controls.
- Added Context-driven activation, Music silence, Night reduced frequency, Focus reduced frequency, and Performance Save filtering.
- Added `agent-plugin`; disabling it pauses all agents.
- Added local Workspace Memory records for recent agent, suggestion history, accepted recommendations, dismissed recommendations, and agent usage.
- Added bilingual voice commands without adding network upload or private-data reads.
- Preserved all V1-V7 functionality and the single particle render loop.

## 7.0.0 - 2026-06-03

- Added local-only Workspace Memory with automatic startup restoration.
- Added user profile fields, scene analytics, Most Used Worlds ranking, and preference recommendations.
- Added Study, Coding, Music, Night, and custom workspace snapshots.
- Added Memory Center Dashboard controls, clear-memory action, keyboard shortcuts, and bilingual voice commands.
- Added `workspace-memory-plugin` with enable, disable, import, and export support through the Plugin System.
- Added asynchronous save scheduling, close-time flush, and stale-save invalidation after memory clearing.
- Preserved all V1-V6 functionality and the single particle render loop.

## 6.0.0 - 2026-06-03

- Added isolated Plugin Manager architecture and ten built-in local plugins.
- Added lifecycle idempotency, dependency checks, dependent shutdown, resource release, and Event Bus plugin events.
- Added searchable Plugin Center with real enable/disable controls, Plugin Dashboard metrics, `P`, `Ctrl+Shift+P`, and bilingual voice access.
- Added plugin error isolation with automatic disable, `PLUGIN ERROR` HUD feedback, and System Health integration.
- Reserved Marketplace categories while keeping online downloads disabled.
- Preserved all V1-V5 functionality and the single particle render loop.

## 5.0.0 - 2026-06-02

- Added Ultimate Dashboard, System Health, Voice Commander, and unified Command Router modules.
- Added collapsed Dashboard with live system metrics, `D` toggle, and five updates per second.
- Added two-second health checks for sustained low FPS, rendering, music, camera, gestures, context, Event Bus diagnostics, animation loops, and duplicate listener attempts.
- Added opt-in Web Speech API support with `V`, graceful unsupported and permission-denied handling, and Chinese and English commands.
- Added `Q` and `E` quality shortcuts and unified routing for voice, keyboard, buttons, and gestures.
- Preserved all V1-V4 functionality and privacy defaults.

## 4.0.0 - 2026-06-02

- Added privacy-first `context-engine.js` with Study, Coding, Music, Night, Idle, and Performance Save contexts.
- Added AI Context HUD, Suggest Mode, Auto Mode, confidence, recommendation, and last-switch status.
- Added `A` Auto Mode toggle and `Shift+A` recommendation acceptance.
- Added 60-second automatic switch cooldown and five-minute manual scene override protection.
- Added context Event Bus events without reading private files, scanning browser history, or uploading data.
- Preserved all V1, V2, V2.5, and V3 systems.

## 3.0.0 - 2026-06-02

- Added Web Audio music analysis with normalized volume, bass, mid, treble, beat, and energy metrics.
- Added bundled original `bg.mp3`, local import, and drag-and-drop loading.
- Added Music HUD spectrum bars, playback controls, Music Mode, and `M`, `N`, `B` shortcuts.
- Added global bass expansion, mid orbit changes, treble flicker, Beat Pulse, and energy core glow.
- Added six distinct world-specific music responses.
- Preserved V1, V2, and V2.5 interaction systems and the single particle render loop.

## 2.5.0 - 2026-06-02

- Added two-hand MediaPipe tracking and six advanced gestures.
- Added pinch focus, dual-palm multiverse burst, dual-fist Calm / Focus, core expansion, core collapse, and circle-driven orbital rotation.
- Added static frame debouncing, dynamic gesture motion histories, and independent cooldowns.
- Added an `ADVANCED READY / ACTIVE` Hand HUD indicator.
- Preserved V1 and V2 worlds, manual controls, camera fallback, quality behavior, and Tauri packaging.

## 2.0.0 - 2026-06-02

- Added opt-in camera preview with explicit permission, busy, error, and manual fallback states.
- Added MediaPipe Hands recognition for open palm, fist, pointing, and horizontal swipes.
- Added hand-control HUD, `H` camera toggle, `R` reset, and `Esc` preview hiding.
- Preserved all V1 manual controls and desktop packaging behavior.
- Fixed the Ultimate pointer interaction branch so nearby particles never reference an uninitialized phase value.

## 1.0.0 - 2026-06-02

- Added six interactive cinematic particle universes.
- Added navigation, shockwave system, quality controls, adaptive rendering, HUD, and fullscreen.
- Added Vite production build and Tauri desktop packaging configuration.
- Added offline desktop fonts, generated application icons, and a verified Windows NSIS installer target.
- Added a native dark window background to prevent a white flash before the first WebView frame.
