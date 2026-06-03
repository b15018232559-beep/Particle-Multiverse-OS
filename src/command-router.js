const SCENES = {
  tree: 0, vortex: 1, reactor: 2, neural: 3, tesseract: 4, ultimate: 5,
};

const MIN_VOICE_CONFIDENCE = 0.65;
const VOICE_COOLDOWN_MS = 1000;

const command = (category, result, phrases, action, payload = {}) => ({
  category, result, phrases, action, payload,
});

const VOICE_COMMAND_GROUPS = [
  {
    category: "PAGE",
    title: "页面切换",
    commands: [
      command("PAGE", "NEXT_PAGE", ["下一页", "下一個", "下一個世界", "下一世界", "next", "next page", "next world"], "nextScene"),
      command("PAGE", "PREVIOUS_PAGE", ["上一页", "上一個", "上一個世界", "上一世界", "返回上一页", "back", "previous", "previous page", "previous world"], "previousScene"),
      command("PAGE", "HOME_WORLD", ["回到首页", "回到主页", "回到生命树", "首页", "home", "go home", "home world"], "switchScene", { index: SCENES.tree }),
      command("PAGE", "ULTIMATE_MODE", ["进入终极模式", "打开终极模式", "切到终极模式", "ultimate", "ultimate mode", "open ultimate"], "switchScene", { index: SCENES.ultimate }),
    ],
  },
  {
    category: "SCENE",
    title: "场景切换",
    commands: [
      command("SCENE", "SWITCH_TO_WORLD_TREE", ["进入生命树", "打开生命树", "切到生命树", "生命树", "world tree", "open world tree", "ai world tree"], "switchScene", { index: SCENES.tree }),
      command("SCENE", "SWITCH_TO_BLACK_HOLE", ["进入黑洞", "打开黑洞", "切到黑洞", "黑洞", "black hole", "open black hole", "switch to black hole"], "switchScene", { index: SCENES.vortex }),
      command("SCENE", "SWITCH_TO_ARC_REACTOR", ["进入反应堆", "打开反应堆", "切到反应堆", "反应堆", "arc reactor", "open reactor", "switch to reactor"], "switchScene", { index: SCENES.reactor }),
      command("SCENE", "SWITCH_TO_NEURAL_BRAIN", ["进入神经网络", "打开神经网络", "切到神经网络", "神经网络", "neural brain", "open neural brain", "switch to neural"], "switchScene", { index: SCENES.neural }),
      command("SCENE", "SWITCH_TO_TESSERACT", ["进入四维宇宙", "打开四维宇宙", "切到四维宇宙", "四维宇宙", "tesseract", "open tesseract", "switch to tesseract"], "switchScene", { index: SCENES.tesseract }),
    ],
  },
  {
    category: "PARTICLE",
    title: "粒子控制",
    commands: [
      command("PARTICLE", "PARTICLE_BURST", ["粒子爆发", "爆发", "能量爆发", "burst", "particle burst", "shockwave"], "triggerBurst"),
      command("PARTICLE", "RESET_PARTICLES", ["重置粒子", "重置场景", "复位粒子", "reset", "reset particles", "reset scene"], "resetScene"),
      command("PARTICLE", "QUALITY_UP", ["增强粒子", "提高画质", "增强画质", "quality up", "increase particles", "enhance particles"], "adjustQuality", { direction: 1 }),
      command("PARTICLE", "QUALITY_DOWN", ["降低粒子", "降低画质", "减少粒子", "quality down", "decrease particles", "reduce particles"], "adjustQuality", { direction: -1 }),
    ],
  },
  {
    category: "MUSIC",
    title: "音乐控制",
    commands: [
      command("MUSIC", "PLAY_MUSIC", ["播放音乐", "开始音乐", "play music", "start music"], "playMusic"),
      command("MUSIC", "PAUSE_MUSIC", ["暂停音乐", "停止音乐", "pause music", "stop music"], "pauseMusic"),
      command("MUSIC", "TOGGLE_MUSIC_MODE", ["音乐模式", "打开音乐模式", "切换音乐模式", "music mode", "toggle music mode"], "toggleMusicMode"),
    ],
  },
  {
    category: "SYSTEM",
    title: "系统控制",
    commands: [
      command("SYSTEM", "OPEN_DASHBOARD", ["打开仪表盘", "显示仪表盘", "dashboard", "open dashboard", "show dashboard"], "openDashboard"),
      command("SYSTEM", "CLOSE_DASHBOARD", ["关闭仪表盘", "隐藏仪表盘", "close dashboard", "hide dashboard"], "closeDashboard"),
      command("SYSTEM", "AUTO_MODE_ON", ["开启自动模式", "打开自动模式", "auto mode on", "enable auto mode"], "setAutoMode", { enabled: true }),
      command("SYSTEM", "AUTO_MODE_OFF", ["关闭自动模式", "auto mode off", "disable auto mode"], "setAutoMode", { enabled: false }),
      command("SYSTEM", "SHOW_COMMAND_HELP", ["显示指令", "打开指令", "显示帮助", "帮助", "show commands", "command help", "show help"], "showCommandHelp"),
    ],
  },
  {
    category: "LEGACY",
    title: "兼容命令",
    commands: [
      command("LEGACY", "OPEN_PLUGIN_CENTER", ["打开插件中心", "open plugin center"], "openPluginCenter"),
      command("LEGACY", "SAVE_WORKSPACE", ["保存当前工作空间", "save workspace"], "saveWorkspace"),
      command("LEGACY", "LOAD_STUDY_WORKSPACE", ["加载学习工作空间", "load study workspace"], "loadWorkspace", { id: "study" }),
      command("LEGACY", "LOAD_CODING_WORKSPACE", ["加载编程工作空间", "load coding workspace"], "loadWorkspace", { id: "coding" }),
      command("LEGACY", "LOAD_RESEARCH_WORKSPACE", ["加载研究工作空间", "load research workspace"], "loadWorkspace", { id: "research" }),
      command("LEGACY", "LOAD_MUSIC_WORKSPACE", ["加载音乐工作空间", "load music workspace"], "loadWorkspace", { id: "music" }),
      command("LEGACY", "RESET_MEMORY", ["重置记忆", "reset memory"], "clearMemory"),
      command("LEGACY", "OPEN_STUDY_AGENT", ["打开学习助手", "open study agent"], "openAgent", { id: "study-agent" }),
      command("LEGACY", "OPEN_CODING_AGENT", ["打开编程助手", "open coding agent"], "openAgent", { id: "coding-agent" }),
      command("LEGACY", "OPEN_RESEARCH_AGENT", ["打开研究助手", "open research agent"], "openAgent", { id: "research-agent" }),
      command("LEGACY", "OPEN_AUTOMATION_AGENT", ["打开自动化助手", "open automation agent"], "openAgent", { id: "automation-agent" }),
      command("LEGACY", "CLOSE_ALL_AGENTS", ["关闭所有助手", "close all agents"], "closeAllAgents"),
      command("LEGACY", "TODAY_SUGGESTIONS", ["今天建议我做什么", "what should i do today"], "collectAgentSuggestions"),
      command("LEGACY", "CREATE_TASK", ["创建任务", "create task"], "createMultiAgentTask"),
      command("LEGACY", "START_COLLABORATION", ["开始协作", "start collaboration"], "startCollaboration"),
      command("LEGACY", "STOP_COLLABORATION", ["停止协作", "stop collaboration"], "stopCollaboration"),
      command("LEGACY", "SHOW_TASK_BOARD", ["查看任务板", "show task board"], "showTaskBoard"),
      command("LEGACY", "SHOW_AGENT_STATUS", ["查看agent状态", "查看 agent 状态", "show agent status"], "showAgentStatus"),
      command("LEGACY", "OPEN_MISSION_CONTROL", ["打开任务控制", "打开mission control", "open mission control"], "openMissionControl"),
      command("LEGACY", "CLOSE_MISSION_CONTROL", ["关闭任务控制", "关闭mission control", "close mission control"], "closeMissionControl"),
    ],
  },
];

const COMMANDS = VOICE_COMMAND_GROUPS.flatMap((group) => group.commands.map((item) => [item.phrases, item]));

export class CommandRouter {
  constructor(bus, options = {}) {
    this.bus = bus;
    this.handlers = new Map();
    this.now = options.now ?? (() => Date.now());
    this.minConfidence = options.minConfidence ?? MIN_VOICE_CONFIDENCE;
    this.cooldownMs = options.cooldownMs ?? VOICE_COOLDOWN_MS;
    this.lastVoiceAt = 0;
    this.lastVoiceKey = "";
  }

  register(action, handler) {
    this.handlers.set(action, handler);
    return this;
  }

  dispatch(action, payload = {}, source = "system") {
    const handler = this.handlers.get(action);
    if (!handler) return false;
    handler(payload, source);
    this.bus.emit("COMMAND_EXECUTED", { action, payload, source });
    return true;
  }

  matchText(text) {
    const normalized = this.normalize(text);
    const match = COMMANDS.find(([phrases]) => phrases.some((phrase) => normalized.includes(this.normalize(phrase))));
    if (!match) return null;
    const [, commandDefinition] = match;
    return { ...commandDefinition, payload: { ...(commandDefinition.payload ?? {}) }, normalized };
  }

  routeText(text, confidence = 1) {
    const match = this.matchText(text);
    const decision = this.evaluateVoice(text, confidence, match);
    if (!decision.allowed) {
      this.bus.emit("VOICE_COMMAND", decision.event);
      return false;
    }

    const dispatched = this.dispatch(match.action, match.payload, "voice");
    this.recordVoice(match);
    this.bus.emit("VOICE_COMMAND", {
      text,
      confidence,
      action: match.action,
      result: match.result,
      category: match.category,
      status: dispatched ? "SUCCESS" : "NO_HANDLER",
    });
    return dispatched;
  }

  evaluateVoice(text, confidence = 1, match = this.matchText(text)) {
    if (!match) {
      return {
        allowed: false,
        event: { text, confidence, action: "NOT_RECOGNIZED", result: "未识别命令", status: "NOT_RECOGNIZED" },
      };
    }

    if (confidence < this.minConfidence) {
      return {
        allowed: false,
        event: { text, confidence, action: match.action, result: "识别不确定", status: "LOW_CONFIDENCE", category: match.category },
      };
    }

    const now = this.now();
    const key = `${match.action}:${JSON.stringify(match.payload ?? {})}`;
    if (key === this.lastVoiceKey && now - this.lastVoiceAt < this.cooldownMs) {
      return {
        allowed: false,
        event: { text, confidence, action: match.action, result: "命令冷却中", status: "COOLDOWN", category: match.category },
      };
    }

    return { allowed: true, event: null };
  }

  recordVoice(match) {
    this.lastVoiceAt = this.now();
    this.lastVoiceKey = `${match.action}:${JSON.stringify(match.payload ?? {})}`;
  }

  normalize(text = "") {
    return String(text).trim().toLowerCase().replace(/\s+/g, " ");
  }
}

export { COMMANDS, MIN_VOICE_CONFIDENCE, VOICE_COMMAND_GROUPS };
