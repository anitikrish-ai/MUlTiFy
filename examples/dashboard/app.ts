import { memory, ui, createComponent } from "../../packages/mbuf/src/index.ts";

export const DashboardApp = createComponent(() => {
  const cpuUsage = memory.cell(42);
  const reqPerSec = memory.cell(1250);
  const activeUsers = memory.cell(328);
  const isStreaming = memory.cell(true);

  let timer: any = null;

  const startTelemetry = () => {
    if (timer) return;
    timer = setInterval(() => {
      if (!isStreaming.get()) return;
      cpuUsage.update((v) => Math.min(100, Math.max(10, v + Math.floor(Math.random() * 11) - 5)));
      reqPerSec.update((v) => Math.max(200, v + Math.floor(Math.random() * 51) - 25));
      activeUsers.update((v) => Math.max(50, v + Math.floor(Math.random() * 7) - 3));
    }, 400);
  };

  const stopTelemetry = () => {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  };

  startTelemetry();

  return ui.element(
    "div",
    { class: "example-card", style: "max-width: 800px;" },
    ui.element(
      "div",
      { style: "display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;" },
      ui.element("h2", null, "Reactive Infrastructure Dashboard"),
      ui.element(
        "button",
        {
          class: () => (isStreaming.get() ? "btn btn-danger" : "btn btn-primary"),
          onClick: () => isStreaming.update((s) => !s)
        },
        ui.text(() => (isStreaming.get() ? "Pause Telemetry" : "Resume Telemetry"))
      )
    ),

    // Metric Cards Grid
    ui.element(
      "div",
      { style: "display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px;" },

      // CPU Card
      ui.element(
        "div",
        { style: "background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 6px; padding: 16px;" },
        ui.element("div", { style: "font-size: 13px; color: var(--text-secondary);" }, "CPU Utilization"),
        ui.element(
          "div",
          { class: "counter-display", style: "margin: 8px 0 12px 0;" },
          ui.text(() => `${cpuUsage.get()}%`)
        ),
        ui.element(
          "div",
          { style: "height: 6px; background: #374151; border-radius: 3px; overflow: hidden;" },
          ui.element("div", {
            style: () =>
              `height: 100%; width: ${cpuUsage.get()}%; background: ${
                cpuUsage.get() > 80 ? "var(--color-danger)" : "var(--color-accent)"
              }; transition: width 0.3s ease;`
          })
        )
      ),

      // Requests/sec Card
      ui.element(
        "div",
        { style: "background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 6px; padding: 16px;" },
        ui.element("div", { style: "font-size: 13px; color: var(--text-secondary);" }, "Throughput"),
        ui.element(
          "div",
          { class: "counter-display", style: "margin: 8px 0 12px 0; color: #34d399;" },
          ui.text(() => `${reqPerSec.get().toLocaleString()} req/s`)
        ),
        ui.element("div", { style: "font-size: 12px; color: var(--text-muted);" }, "Zero dropped frames")
      ),

      // Active Users Card
      ui.element(
        "div",
        { style: "background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 6px; padding: 16px;" },
        ui.element("div", { style: "font-size: 13px; color: var(--text-secondary);" }, "Active Sessions"),
        ui.element(
          "div",
          { class: "counter-display", style: "margin: 8px 0 12px 0; color: #fbbf24;" },
          ui.text(() => `${activeUsers.get()}`)
        ),
        ui.element("div", { style: "font-size: 12px; color: var(--text-muted);" }, "Connected via WebSocket")
      )
    ),

    // Live Framework Memory Stats
    ui.element(
      "div",
      { style: "background: #0d1117; border: 1px solid var(--border-color); border-radius: 6px; padding: 16px; font-family: var(--font-mono); font-size: 13px;" },
      ui.element("div", { style: "color: #58a6ff; font-weight: 600; margin-bottom: 8px;" }, "[MBUF Engine Memory Telemetry]"),
      ui.element(
        "div",
        { style: "color: var(--text-secondary);" },
        ui.text(() => {
          const stats = memory.stats();
          return `Cell Slots Capacity: ${stats.capacity} | Active Cells: ${stats.allocated} | Free Slots: ${stats.freeSlots} | Total Writes: ${stats.totalWrites}`;
        })
      )
    )
  );
});

