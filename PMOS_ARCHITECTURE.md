# PMOS Architecture

Particle Multiverse OS V10 is the final consolidation release. It keeps V1-V9 features and organizes them into four product layers.

```mermaid
flowchart TB
  User["User"]
  L1["Layer 1: Visual Layer\nSix particle worlds"]
  L2["Layer 2: Interaction Layer\nMouse, Trackpad, Keyboard, Camera, Gesture, Voice"]
  L3["Layer 3: Intelligence Layer\nContext, Workspace Memory, Agent Layer, Multi-Agent"]
  L4["Layer 4: Operating Layer\nPlugin System, Task Center, Command Router, Dashboard, Health"]
  MC["Mission Control\nTab overlay"]
  CC["Command Center\nUnified command dispatch"]
  User --> L2 --> CC
  CC --> L1
  CC --> L3
  CC --> L4
  L1 --> MC
  L3 --> MC
  L4 --> MC
```

## Layer 1: Visual Layer

- AI World Tree
- Black Hole Universe
- ARC Reactor
- Neural Brain
- Tesseract
- Ultimate

The Ultimate world now renders a central core with Worlds, Agent, Memory, Task, Plugin, and Voice orbits.

## Layer 2: Interaction Layer

- Mouse and trackpad particle controls
- Keyboard shortcuts
- Camera and gesture control
- Voice Commander

All system commands route through Command Center into the existing Command Router.

## Layer 3: Intelligence Layer

- Context Engine
- Workspace Memory
- Agent Layer
- Multi-Agent System

Workspace Memory remains local-only and includes Study, Coding, Research, Music, Night, and custom workspaces.

## Layer 4: Operating Layer

- Plugin System
- Task Center
- Command Router
- System Command Center Dashboard
- System Health Pro

Mission Control reads from this layer and shows all worlds, agents, tasks, plugins, workspaces, and system status.

## Module Relationship

```mermaid
flowchart LR
  CommandCenter["command-center.js"] --> CommandRouter["command-router.js"]
  MissionControl["mission-control.js"] --> SceneManager["scene-manager.js"]
  MissionControl --> AgentManager["agent-manager.js"]
  MissionControl --> MultiAgentManager["multi-agent-manager.js"]
  MissionControl --> PluginManager["plugin-manager.js"]
  MissionControl --> WorkspaceMemory["workspace-memory.js"]
  MissionControl --> SystemHealth["system-health.js"]
  MultiAgentManager --> TaskBoard["task-board.js"]
  SceneManager --> ParticleEngine["particle-engine.js"]
```

## Agent Flow

```mermaid
sequenceDiagram
  participant U as User
  participant C as Coordinator
  participant P as Planner
  participant E as Executor
  participant R as Reviewer
  participant M as Memory
  U->>C: Create task
  C->>M: Load local memory summary
  C->>P: Assign planning
  P->>E: Send steps
  E->>R: Send execution result
  R->>C: Review outcome
  C->>U: Final output
```

## Plugin Architecture

```mermaid
flowchart TB
  PluginManager["Plugin Manager"] --> Builtins["Built-in local plugins"]
  PluginManager --> PluginCenter["Plugin Center"]
  PluginManager --> Dashboard["Dashboard metrics"]
  Marketplace["Marketplace reservation\nVisual / Music / Agent / Productivity"] -.disabled.-> PluginManager
```

The V10 marketplace is an architecture reservation only. Online installation is disabled.

## Mission Control Architecture

```mermaid
flowchart TB
  Tab["Tab shortcut"] --> Mission["Mission Control"]
  Mission --> Worlds["Worlds"]
  Mission --> Agents["Agents"]
  Mission --> Tasks["Task Center"]
  Mission --> Plugins["Plugins"]
  Mission --> Workspaces["Workspace OS"]
  Mission --> Systems["System Status"]
```
