import { memory, ui, createComponent } from "../../packages/mbuf/src/index.ts";

interface Employee {
  id: number;
  name: string;
  role: string;
  department: string;
  salary: number;
}

const INITIAL_DATA: Employee[] = [
  { id: 1, name: "Alice Jenkins", role: "Compiler Engineer", department: "Architecture", salary: 145000 },
  { id: 2, name: "Bob Smith", role: "Runtime Specialist", department: "Core", salary: 135000 },
  { id: 3, name: "Carol Danvers", role: "Frontend Architect", department: "Architecture", salary: 155000 },
  { id: 4, name: "David Kim", role: "Performance Engineer", department: "Core", salary: 140000 },
  { id: 5, name: "Elena Rostova", role: "DevTools Lead", department: "Tooling", salary: 130000 },
  { id: 6, name: "Frank Miller", role: "Systems Programmer", department: "Architecture", salary: 150000 }
];

export const DataTableApp = createComponent(() => {
  const searchQuery = memory.cell("");
  const sortKey = memory.cell<keyof Employee>("name");
  const sortAsc = memory.cell(true);

  const filteredEmployees = memory.computed(() => {
    const q = searchQuery.get().toLowerCase();
    const key = sortKey.get();
    const asc = sortAsc.get();

    let list = INITIAL_DATA.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.role.toLowerCase().includes(q) ||
        e.department.toLowerCase().includes(q)
    );

    list.sort((a, b) => {
      const valA = a[key];
      const valB = b[key];
      if (valA < valB) return asc ? -1 : 1;
      if (valA > valB) return asc ? 1 : -1;
      return 0;
    });

    return list;
  });

  const toggleSort = (key: keyof Employee) => {
    if (sortKey.get() === key) {
      sortAsc.update((asc) => !asc);
    } else {
      sortKey.set(key);
      sortAsc.set(true);
    }
  };

  return ui.element(
    "div",
    { class: "example-card", style: "max-width: 800px;" },
    ui.element("h2", null, "Searchable Data Table"),
    ui.element(
      "div",
      { style: "display: flex; gap: 12px; margin-bottom: 16px; align-items: center;" },
      ui.element("input", {
        type: "text",
        placeholder: "Search employees by name, role, department...",
        style: "flex: 1;",
        value: () => searchQuery.get(),
        onInput: (e: any) => searchQuery.set(e.target.value)
      }),
      ui.element(
        "span",
        { style: "font-size: 13px; color: var(--text-secondary);" },
        ui.text(() => `${filteredEmployees.get().length} results`)
      )
    ),
    ui.element(
      "div",
      { class: "table-container" },
      ui.element(
        "table",
        null,
        ui.element(
          "thead",
          null,
          ui.element(
            "tr",
            null,
            ui.element(
              "th",
              { style: "cursor: pointer;", onClick: () => toggleSort("name") },
              ui.text(() => `Name ${sortKey.get() === "name" ? (sortAsc.get() ? "▲" : "▼") : ""}`)
            ),
            ui.element("th", null, "Role"),
            ui.element(
              "th",
              { style: "cursor: pointer;", onClick: () => toggleSort("department") },
              ui.text(() => `Department ${sortKey.get() === "department" ? (sortAsc.get() ? "▲" : "▼") : ""}`)
            ),
            ui.element(
              "th",
              { style: "cursor: pointer;", onClick: () => toggleSort("salary") },
              ui.text(() => `Salary ${sortKey.get() === "salary" ? (sortAsc.get() ? "▲" : "▼") : ""}`)
            )
          )
        ),
        ui.element(
          "tbody",
          null,
          ui.each(
            () => filteredEmployees.get(),
            (emp) =>
              ui.element(
                "tr",
                null,
                ui.element("td", { style: "font-weight: 500;" }, emp.name),
                ui.element("td", null, emp.role),
                ui.element("td", null, emp.department),
                ui.element("td", { style: "font-family: var(--font-mono);" }, `$${emp.salary.toLocaleString()}`)
              ),
            (emp) => emp.id
          )
        )
      )
    )
  );
});

