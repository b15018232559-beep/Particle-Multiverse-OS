# Particle Multiverse OS Plugin System

## Scope

The local extension layer does not change the particle render loop. Plugins communicate through the existing Event Bus. They do not delete core systems, mutate global state, create additional animation loops, or bind duplicate listeners.

## Built-In Plugins

| Plugin | Purpose | Dependencies | Default |
| --- | --- | --- | --- |
| `scene-plugin` | Scene management and world switching | None | Enabled |
| `music-plugin` | Music universe integration | `effects-plugin` | Enabled |
| `camera-plugin` | Camera integration boundary | None | Enabled |
| `gesture-plugin` | Gesture integration boundary | `camera-plugin` | Enabled |
| `voice-plugin` | Voice integration boundary | `keyboard-plugin` | Disabled |
| `dashboard-plugin` | Dashboard integration boundary | `performance-plugin` | Enabled |
| `context-plugin` | AI context integration boundary | `scene-plugin`, `performance-plugin` | Enabled |
| `performance-plugin` | Performance integration boundary | None | Enabled |
| `keyboard-plugin` | Keyboard integration boundary | None | Enabled |
| `effects-plugin` | Particle effects integration boundary | `scene-plugin` | Enabled |
| `workspace-memory-plugin` | Local workspace persistence, analytics, import, and export | `scene-plugin`, `performance-plugin`, `dashboard-plugin` | Enabled |
| `agent-plugin` | Local AI Agent Layer control and global agent pause | `context-plugin`, `workspace-memory-plugin`, `dashboard-plugin` | Enabled |

Voice remains disabled by default to preserve the existing privacy behavior.

## Lifecycle

Every plugin implements:

```text
init()
enable()
disable()
destroy()
getStatus()
getMetadata()
```

`enable()` and `disable()` are idempotent. Disabling a plugin releases tracked resources and disables active dependents. Failures emit `PLUGIN_ERROR`, are isolated from the particle engine, and leave the plugin in `ERROR` until it is retried successfully.

## Events

```text
PLUGIN_REGISTERED
PLUGIN_ENABLED
PLUGIN_DISABLED
PLUGIN_ERROR
PLUGIN_STATUS_CHANGED
```

## Plugin Center

Open the Plugin Center with `P`, `Ctrl+Shift+P`, the Ultimate Dashboard button, `open plugin center`, or `打开插件中心`. The panel shows current state, explanations, errors, search, and real enable/disable actions.

## Marketplace Reservation

The manager reserves Visual, Music, Agent, Camera, and Productivity categories. Online installation remains intentionally disabled.
