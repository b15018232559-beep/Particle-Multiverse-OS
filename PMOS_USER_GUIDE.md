# PMOS User Guide

## Start

```bash
npm install
npm run dev
```

Open `http://localhost:1420`.

For desktop:

```bash
npm run tauri dev
```

## Core Controls

- `Tab`: open or close Mission Control.
- `D`: open System Command Center Dashboard.
- `P`: open Plugin Center.
- `V`: toggle Voice Commander.
- `Space`: trigger burst.
- `F11`: fullscreen.
- `Esc`: exit fullscreen or close Mission Control / Plugin Center.
- `Ctrl+S`: save workspace.
- `Ctrl+L`: load latest workspace.
- `Ctrl+Shift+R`: clear local memory.

## Mission Control

Mission Control shows:

- all worlds
- all agents
- task status
- plugins
- workspaces
- system status

World and Workspace cards are clickable. Task controls can create a system review task and start the Agent Team.

## Workspace OS

Built-in workspaces:

- Study Workspace
- Coding Workspace
- Research Workspace
- Music Workspace
- Night Workspace
- Custom Workspace

Workspace saves include scene, music state, agents, plugins, HUD visibility, Dashboard state, Auto Mode, and quality.

## Privacy

All Workspace Memory, Agent history, task history, and preferences are stored locally. PMOS does not scan private files, browser history, or upload user data.
