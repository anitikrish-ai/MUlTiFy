import { memory, ui, createComponent } from "../../packages/mbuf/src/index.js";

export const CounterApp = createComponent(() => {
  const count = memory.cell(0);
  const step = memory.cell(1);

  return ui.element(
    "div",
    { class: "example-card" },
    ui.element("h2", null, "Reactive Counter"),
    ui.element(
      "p",
      { class: "counter-display" },
      ui.text(() => `Current Count: ${count.get()}`)
    ),
    ui.element(
      "div",
      { class: "button-group" },
      ui.element(
        "button",
        {
          class: "btn btn-primary",
          onClick: () => count.update((c) => c + step.get())
        },
        ui.text(() => `+${step.get()}`)
      ),
      ui.element(
        "button",
        {
          class: "btn btn-secondary",
          onClick: () => count.update((c) => c - step.get())
        },
        ui.text(() => `-${step.get()}`)
      ),
      ui.element(
        "button",
        {
          class: "btn btn-outline",
          onClick: () => count.set(0)
        },
        "Reset"
      )
    ),
    ui.element(
      "div",
      { style: "margin-top: 16px; font-size: 14px;" },
      ui.element("label", null, "Step size: "),
      ui.element("input", {
        type: "number",
        value: () => step.get(),
        style: "width: 60px; padding: 4px 8px; margin-left: 8px;",
        onInput: (e: any) => step.set(Number(e.target.value) || 1)
      })
    )
  );
});

