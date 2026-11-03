import { memory, ui, createComponent } from "../../packages/mbuf/src/index.ts";

interface TodoItem {
  id: number;
  text: string;
  completed: boolean;
}

export const TodoApp = createComponent(() => {
  const todos = memory.cell<TodoItem[]>([
    { id: 1, text: "Build MBUF memory engine", completed: true },
    { id: 2, text: "Implement reactive microtask scheduler", completed: true },
    { id: 3, text: "Compile declarative UI syntax", completed: false }
  ]);
  const newTodoText = memory.cell("");
  const filter = memory.cell<"all" | "active" | "completed">("all");

  const filteredTodos = memory.computed(() => {
    const list = todos.get();
    const currentFilter = filter.get();
    if (currentFilter === "active") return list.filter((t) => !t.completed);
    if (currentFilter === "completed") return list.filter((t) => t.completed);
    return list;
  });

  const activeCount = memory.computed(() => {
    return todos.get().filter((t) => !t.completed).length;
  });

  let nextId = 4;

  const addTodo = () => {
    const textVal = newTodoText.get().trim();
    if (!textVal) return;
    todos.update((prev) => [...prev, { id: nextId++, text: textVal, completed: false }]);
    newTodoText.set("");
  };

  const toggleTodo = (id: number) => {
    todos.update((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const removeTodo = (id: number) => {
    todos.update((prev) => prev.filter((t) => t.id !== id));
  };

  return ui.element(
    "div",
    { class: "example-card" },
    ui.element("h2", null, "Reactive Todo List"),

    // Add Todo Input
    ui.element(
      "div",
      { style: "display: flex; gap: 8px; margin-bottom: 16px;" },
      ui.element("input", {
        type: "text",
        placeholder: "What needs to be done?",
        style: "flex: 1;",
        value: () => newTodoText.get(),
        onInput: (e: any) => newTodoText.set(e.target.value),
        onKeydown: (e: any) => {
          if (e.key === "Enter") addTodo();
        }
      }),
      ui.element(
        "button",
        { class: "btn btn-primary", onClick: addTodo },
        "Add Task"
      )
    ),

    // Filter Controls
    ui.element(
      "div",
      { style: "display: flex; gap: 8px; margin-bottom: 16px; align-items: center;" },
      ui.element(
        "button",
        {
          class: () => (filter.get() === "all" ? "btn btn-primary" : "btn"),
          onClick: () => filter.set("all")
        },
        "All"
      ),
      ui.element(
        "button",
        {
          class: () => (filter.get() === "active" ? "btn btn-primary" : "btn"),
          onClick: () => filter.set("active")
        },
        "Active"
      ),
      ui.element(
        "button",
        {
          class: () => (filter.get() === "completed" ? "btn btn-primary" : "btn"),
          onClick: () => filter.set("completed")
        },
        "Completed"
      ),
      ui.element(
        "span",
        { style: "margin-left: auto; font-size: 13px; color: var(--text-secondary);" },
        ui.text(() => `${activeCount.get()} items left`)
      )
    ),

    // Keyed list rendering of todos
    ui.each(
      () => filteredTodos.get(),
      (item) =>
        ui.element(
          "div",
          { class: "todo-item" },
          ui.element(
            "label",
            { style: "display: flex; align-items: center; gap: 10px; cursor: pointer;" },
            ui.element("input", {
              type: "checkbox",
              checked: item.completed,
              onChange: () => toggleTodo(item.id)
            }),
            ui.element(
              "span",
              { class: item.completed ? "todo-completed" : "" },
              item.text
            )
          ),
          ui.element(
            "button",
            {
              class: "btn btn-danger",
              style: "padding: 4px 8px; font-size: 12px;",
              onClick: () => removeTodo(item.id)
            },
            "Delete"
          )
        ),
      (item) => item.id
    )
  );
});

