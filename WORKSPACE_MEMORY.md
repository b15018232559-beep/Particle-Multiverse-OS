# Particle Multiverse OS V7 Workspace Memory

## How Memory Works

Workspace Memory stores the current environment locally and restores it asynchronously after the built-in plugins register. It records:

- Current world
- Quality level
- Music playback and Music Mode state
- HUD visibility
- Ultimate Dashboard state
- Plugin states
- Auto Mode state
- Per-world usage time
- User preferences and saved workspace snapshots
- Recent active agent, suggestion history, accepted and ignored suggestions, and agent usage counts

Saving is queued through microtasks so it does not block particle rendering. Window close uses a synchronous local flush because browser teardown cannot wait for asynchronous work.

## Local Storage

Data is stored only in browser or Tauri WebView `localStorage` under:

```text
particle-multiverse-os:v7:workspace-memory
```

The app does not upload memory data, read private files, read browser history, or read chat content.

The source default profile template is [src/user-profile.json](src/user-profile.json).

## Save And Load

Open Ultimate Dashboard with `D`.

| Action | Input |
| --- | --- |
| Save current workspace | Dashboard `SAVE`, `Ctrl+S`, `save workspace`, or `保存当前工作空间` |
| Load latest workspace | Dashboard `LOAD LAST` or `Ctrl+L` |
| Load Study preset | Dashboard `STUDY`, `load study workspace`, or `加载学习工作空间` |
| Load Coding preset | Dashboard `CODING`, `load coding workspace`, or `加载编程工作空间` |
| Load Music preset | Dashboard `MUSIC`, `load music workspace`, or `加载音乐工作空间` |
| Load Night preset | Dashboard `NIGHT` |

Enter a name in `CUSTOM WORKSPACE` before saving to create a named snapshot.

## Clear Memory

Use Dashboard `CLEAR MEMORY`, `Ctrl+Shift+R`, `reset memory`, or `重置记忆`.

Clear Memory removes workspaces, usage history, preferences, scene statistics, and the saved last environment. Pending stale saves are invalidated before they can write old data back.

## Memory Plugin

`workspace-memory-plugin` is managed through Plugin Center. It supports lifecycle enable and disable plus programmatic `export()` and `import(serialized)` operations. Disabling it suspends local persistence without affecting the particle engine.

## Event Bus

```text
MEMORY_LOADED
MEMORY_SAVED
WORKSPACE_SAVED
WORKSPACE_LOADED
MEMORY_CLEARED
PREFERENCE_UPDATED
```
