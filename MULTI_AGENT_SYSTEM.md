# Multi-Agent System

Particle Multiverse OS V9 adds a local Multi-Agent System without rebuilding the app or removing V1-V8 features.

## Files

- `src/multi-agent-manager.js`: registers the team, coordinates task flow, emits task events, limits discussion history, and isolates errors.
- `src/task-board.js`: renders the Dashboard Team View, Task Flow, Discussion Flow, and Task Board.
- `src/multi-agent/coordinator-agent.js`: accepts tasks, assigns planning, and approves final output.
- `src/multi-agent/planner-agent.js`: decomposes tasks into clear execution steps.
- `src/multi-agent/executor-agent.js`: executes local task steps across Scene, Music, Camera, Plugin, and Workspace surfaces.
- `src/multi-agent/reviewer-agent.js`: checks logic, performance, structure, and stability.
- `src/multi-agent/memory-agent.js`: reads local Workspace Memory summaries only.

## Agent Team

| Agent | Role | Status |
| --- | --- | --- |
| Coordinator | Receives tasks, assigns work, coordinates the team, and produces the final result. | `ACTIVE`, `IDLE`, `BUSY`, `ERROR` |
| Planner | Breaks tasks into route steps. | `ACTIVE`, `IDLE`, `BUSY`, `ERROR` |
| Executor | Runs approved local task steps. | `ACTIVE`, `IDLE`, `BUSY`, `ERROR` |
| Reviewer | Reviews logic, performance, structure, and stability. | `ACTIVE`, `IDLE`, `BUSY`, `ERROR` |
| Memory | Reads favorite scene, workspace, usage history, task history, and agent history from local memory. | `ACTIVE`, `IDLE`, `BUSY`, `ERROR` |

## Task Flow

```text
User -> Coordinator -> Planner -> Executor -> Reviewer -> Coordinator -> Final Output
```

The manager emits:

- `AGENT_TASK_CREATED`
- `AGENT_TASK_ASSIGNED`
- `AGENT_TASK_STARTED`
- `AGENT_TASK_COMPLETED`
- `AGENT_TASK_FAILED`
- `AGENT_REVIEW_COMPLETED`
- `AGENT_MEMORY_LOADED`

Task Board groups tasks into `PENDING`, `RUNNING`, `COMPLETED`, and `FAILED`.

## Dashboard

Open Dashboard with `D`, then expand `MULTI AGENT CENTER`.

Available controls:

- `CREATE TASK`: creates a real local task from the task input.
- `START COLLAB`: runs pending tasks through the team pipeline.
- `STOP`: stops collaboration and returns team agents to idle.
- `STATUS`: opens the Team View and refreshes the Task Board.

Recent Agent Discussion shows Coordinator, Planner, Executor, Reviewer, and Memory messages. The manager stores only the latest 50 discussion entries.

## Context And Voice

Context linkage:

- `CODING`: prioritizes Planner and Executor.
- `STUDY`: prioritizes Memory and activates the V8 Research Agent.
- `PERFORMANCE_SAVE`: pauses non-essential team agents and leaves Coordinator and Memory available.

Voice commands:

- Chinese: `创建任务`, `开始协作`, `停止协作`, `查看任务板`, `查看Agent状态`
- English: `create task`, `start collaboration`, `stop collaboration`, `show task board`, `show agent status`

## Workspace Memory

Memory Agent can read only local system summaries:

- `favoriteScene`
- `favoriteWorkspace`
- `usageHistory`
- `taskHistory`
- `agentHistory`
- `currentContext`

Workspace Memory stores recent task events, discussion, team status history, and usage counts in localStorage.

## Privacy

- Agents do not read private files.
- Agents do not scan browser history.
- Agents do not upload data.
- Agents work only from system state, Context, Workspace Memory summaries, and explicit user commands.
- All V9 Multi-Agent data stays local.

## Performance

- No additional `requestAnimationFrame` loop is created.
- Agent execution is event-driven.
- Dashboard and Task Board rendering are throttled to 200 ms or slower.
- Discussion history is capped at 50 entries.
- Agent errors mark the task as failed and do not affect the particle system.
