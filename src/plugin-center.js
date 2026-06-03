export class PluginCenter {
  constructor(bus, manager, root) {
    this.bus = bus;
    this.manager = manager;
    this.root = root;
    this.list = root.querySelector("#plugin-list");
    this.search = root.querySelector("#plugin-search");
    this.details = root.querySelector("#plugin-details");
    this.open = false;
    this.search.addEventListener("input", () => this.render());
    bus.on("PLUGIN_STATUS_CHANGED", () => this.render());
    bus.on("PLUGIN_ERROR", ({ id, message }) => {
      this.details.textContent = `${id}: ${message}`;
      this.root.classList.add("has-error");
    });
  }

  show(focusSearch = false) {
    this.open = true;
    this.root.classList.add("open");
    this.render();
    if (focusSearch) this.search.focus();
  }

  hide() {
    this.open = false;
    this.root.classList.remove("open");
  }

  toggle(focusSearch = false) {
    if (this.open) this.hide();
    else this.show(focusSearch);
  }

  render() {
    const query = this.search.value.trim().toLowerCase();
    const plugins = this.manager.list().filter((plugin) => !query || `${plugin.id} ${plugin.name} ${plugin.description}`.toLowerCase().includes(query));
    this.list.replaceChildren(...plugins.map((plugin) => {
      const row = document.createElement("div");
      row.className = "plugin-row";
      const info = document.createElement("button");
      info.className = "plugin-info";
      info.textContent = `${plugin.id}: ${plugin.status}`;
      info.addEventListener("click", () => { this.details.textContent = plugin.error?.message ?? plugin.description; });
      const toggle = document.createElement("button");
      toggle.className = "plugin-switch";
      toggle.textContent = plugin.status === "ENABLED" ? "DISABLE" : "ENABLE";
      toggle.addEventListener("click", () => this.manager.toggle(plugin.id));
      row.append(info, toggle);
      return row;
    }));
  }
}
