# Particle Multiverse OS V8 Agent Layer

## Overview

V8 adds four local assistants. They operate only on explicit commands, current system state, AI Context, and Workspace Memory. They do not upload data, read private files, scan browser history, or read chat content.

## Agents

| Agent | Purpose |
| --- | --- |
| Study Agent | Learning mode, review reminders, knowledge organization, and Study Workspace recommendations |
| Coding Agent | Project status, development stage, file structure, and next-step guidance |
| Research Agent | Source organization, report structure, citation reminders, and data-analysis entry points |
| Automation Agent | Quick tasks, mode switching, workspace snapshots, and plugin status checks |

## Agent Manager

`agent-manager.js` registers agents, enables and disables them, collects suggestions, isolates failures, and emits Dashboard status. Supported states:

```text
ACTIVE
IDLE
DISABLED
ERROR
```

Suggestions use:

```json
{
  "agent": "Coding Agent",
  "type": "suggestion",
  "message": "Review the current development stage and update PROJECT_STATUS.md.",
  "priority": "medium",
  "action": "open_project_status"
}
```

## Context Rules

| Context | Agent behavior |
| --- | --- |
| `STUDY` | Activate Study Agent |
| `CODING` | Activate Coding Agent |
| `MUSIC` | Silence and pause agents |
| `NIGHT` | Reduce suggestion frequency |
| `PERFORMANCE_SAVE` | Activate Automation Agent and show only important suggestions |

Default suggestions are throttled to one per agent every 30 seconds. Focus Mode doubles the interval. Night Mode quadruples it. Ignored suggestions remain suppressed for five minutes.

## Agent Center

Open Ultimate Dashboard with `D`, then expand `AGENT CENTER`. It is folded by default and remains inside the Dashboard so it does not cover the central particle core.

The panel supports:

- Enable or disable one agent
- Accept a suggestion
- Ignore a suggestion
- Close all agents

## Voice Commands

| Chinese | English |
| --- | --- |
| `打开学习助手` | `open study agent` |
| `打开编程助手` | `open coding agent` |
| `打开研究助手` | `open research agent` |
| `打开自动化助手` | `open automation agent` |
| `关闭所有助手` | `close all agents` |
| `今天建议我做什么` | `what should I do today` |

## Plugin

`agent-plugin` is managed by Plugin Center. Disabling it pauses all agents. Enabling it restores the Agent Layer without creating another render loop.

## Local Memory

Workspace Memory records the recent active agent, suggestion history, accepted recommendations, ignored recommendations, and agent usage counts in local `localStorage`.
