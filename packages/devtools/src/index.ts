/**
 * @mbuf/devtools
 * In-browser developer tools, memory inspector, and reactive telemetry monitor.
 */

import { defaultMemoryEngine, MemoryEngine } from "@mbuf/memory";
import { element, text } from "@mbuf/renderer";

export interface CellSnapshot {
  id: number;
  slot: number;
  generation: number;
  version: number;
  value: any;
}

export function inspectMemory(engine: MemoryEngine = defaultMemoryEngine): CellSnapshot[] {
  const stats = engine.stats();
  const snapshots: CellSnapshot[] = [];

  // Iterate active slots
  for (let slot = 0; slot < stats.capacity; slot++) {
    // Look up via generation probe
    const gen = (engine as any).generations ? (engine as any).generations[slot] : 0;
    if (gen > 0) {
      const cellId = (slot << 16) | gen;
      if (engine.isValid(cellId)) {
        try {
          const val = (engine as any).values[slot];
          const ver = (engine as any).versions[slot];
          snapshots.push({
            id: cellId,
            slot,
            generation: gen,
            version: ver,
            value: val
          });
        } catch (_) {}
      }
    }
  }

  return snapshots;
}

/**
 * Creates a standalone floating DevTools telemetry badge / panel.
 */
export function createDevToolsPanel(): HTMLElement {
  const panel = element(
    "div",
    {
      class: "mbuf-devtools-panel",
      style:
        "position: fixed; bottom: 12px; right: 12px; background: #0b0f19; border: 1px solid #30363d; border-radius: 8px; padding: 12px; font-family: monospace; font-size: 12px; color: #e6edf3; z-index: 999999; box-shadow: 0 4px 12px rgba(0,0,0,0.5); max-width: 320px;"
    },
    element(
      "div",
      { style: "display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; border-bottom: 1px solid #222d3d; padding-bottom: 4px;" },
      element("strong", { style: "color: #38bdf8;" }, "MBUF DevTools"),
      element("span", { style: "color: #94a3b8; font-size: 10px;" }, "v0.1.0")
    ),
    element(
      "div",
      { id: "mbufDevtoolsContent" },
      "Initializing memory telemetry..."
    )
  );

  setInterval(() => {
    const content = panel.querySelector("#mbufDevtoolsContent");
    if (!content) return;
    const stats = defaultMemoryEngine.stats();
    const cells = inspectMemory();
    content.innerHTML = `
      <div style="margin-bottom: 4px;">Allocated Cells: <strong>${stats.allocated}</strong> / ${stats.capacity}</div>
      <div style="margin-bottom: 6px;">Total Writes: <strong>${stats.totalWrites}</strong></div>
      <div style="max-height: 120px; overflow-y: auto; background: #030712; padding: 6px; border-radius: 4px; font-size: 11px;">
        ${
          cells.length === 0
            ? '<span style="color:#64748b">No active cells</span>'
            : cells
                .map(
                  (c) =>
                    `<div>#${c.slot} [v${c.version}]: <span style="color:#7dd3fc">${escapeVal(c.value)}</span></div>`
                )
                .join("")
        }
      </div>
    `;
  }, 300);

  return panel;
}

function escapeVal(v: any): string {
  if (typeof v === "object" && v !== null) {
    if (Array.isArray(v)) return `Array(${v.length})`;
    return "{...}";
  }
  return String(v);
}

