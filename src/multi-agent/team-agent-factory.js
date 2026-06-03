const STATUS = {
  ACTIVE: "ACTIVE",
  IDLE: "IDLE",
  BUSY: "BUSY",
  ERROR: "ERROR",
};

export function createTeamAgent({ id, name, role }, handler) {
  let status = STATUS.IDLE;
  let lastError = null;

  return {
    id,
    name,
    role,
    init() {
      status = STATUS.IDLE;
      lastError = null;
      return this.getStatus();
    },
    activate() {
      if (status !== STATUS.ERROR) status = STATUS.ACTIVE;
      return this.getStatus();
    },
    idle() {
      if (status !== STATUS.ERROR) status = STATUS.IDLE;
      return this.getStatus();
    },
    busy() {
      if (status !== STATUS.ERROR) status = STATUS.BUSY;
      return this.getStatus();
    },
    setError(error) {
      status = STATUS.ERROR;
      lastError = error?.message ?? String(error ?? "Unknown error");
      return this.getStatus();
    },
    getStatus() {
      return { id, name, role, status, error: lastError };
    },
    handleEvent(event) {
      this.busy();
      try {
        const result = handler(event);
        this.activate();
        return result;
      } catch (error) {
        this.setError(error);
        throw error;
      }
    },
  };
}

export { STATUS as TEAM_AGENT_STATUS };
