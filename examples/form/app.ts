import { memory, ui, createComponent } from "../../packages/mbuf/src/index.js";

export const FormApp = createComponent(() => {
  const name = memory.cell("");
  const email = memory.cell("");
  const password = memory.cell("");
  const agreeTerms = memory.cell(false);
  const submitted = memory.cell(false);

  // Validation rules
  const nameError = memory.computed(() => {
    const val = name.get().trim();
    if (!val) return "Name is required.";
    if (val.length < 3) return "Name must be at least 3 characters.";
    return null;
  });

  const emailError = memory.computed(() => {
    const val = email.get().trim();
    if (!val) return "Email is required.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return "Invalid email address format.";
    return null;
  });

  const passwordError = memory.computed(() => {
    const val = password.get();
    if (!val) return "Password is required.";
    if (val.length < 8) return "Password must be at least 8 characters.";
    return null;
  });

  const isFormValid = memory.computed(() => {
    return (
      nameError.get() === null &&
      emailError.get() === null &&
      passwordError.get() === null &&
      agreeTerms.get() === true
    );
  });

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    if (isFormValid.get()) {
      submitted.set(true);
    }
  };

  const handleReset = () => {
    name.set("");
    email.set("");
    password.set("");
    agreeTerms.set(false);
    submitted.set(false);
  };

  return ui.element(
    "div",
    { class: "example-card", style: "max-width: 560px;" },
    ui.element("h2", null, "Reactive Form Validation"),

    ui.when(
      () => submitted.get(),
      () =>
        ui.element(
          "div",
          { style: "background: #064e3b; border: 1px solid #059669; border-radius: 6px; padding: 16px; margin-bottom: 16px;" },
          ui.element("h3", { style: "color: #34d399; margin-bottom: 8px;" }, "Form Submitted Successfully"),
          ui.element("p", { style: "font-size: 14px;" }, ui.text(() => `Welcome, ${name.get()} (${email.get()})!`)),
          ui.element(
            "button",
            { class: "btn btn-primary", style: "margin-top: 8px;", onClick: handleReset },
            "Register Another User"
          )
        ),
      () =>
        ui.element(
          "form",
          { onSubmit: handleSubmit },

          // Name field
          ui.element(
            "div",
            { style: "margin-bottom: 16px;" },
            ui.element("label", { style: "display: block; font-size: 13px; font-weight: 600; margin-bottom: 6px;" }, "Full Name"),
            ui.element("input", {
              type: "text",
              style: "width: 100%;",
              placeholder: "Jane Doe",
              value: () => name.get(),
              onInput: (e: any) => name.set(e.target.value)
            }),
            ui.when(
              () => nameError.get(),
              (err) => ui.element("div", { style: "color: var(--color-danger); font-size: 12px; margin-top: 4px;" }, err)
            )
          ),

          // Email field
          ui.element(
            "div",
            { style: "margin-bottom: 16px;" },
            ui.element("label", { style: "display: block; font-size: 13px; font-weight: 600; margin-bottom: 6px;" }, "Email Address"),
            ui.element("input", {
              type: "email",
              style: "width: 100%;",
              placeholder: "jane@company.com",
              value: () => email.get(),
              onInput: (e: any) => email.set(e.target.value)
            }),
            ui.when(
              () => emailError.get(),
              (err) => ui.element("div", { style: "color: var(--color-danger); font-size: 12px; margin-top: 4px;" }, err)
            )
          ),

          // Password field
          ui.element(
            "div",
            { style: "margin-bottom: 16px;" },
            ui.element("label", { style: "display: block; font-size: 13px; font-weight: 600; margin-bottom: 6px;" }, "Password"),
            ui.element("input", {
              type: "password",
              style: "width: 100%;",
              placeholder: "At least 8 characters",
              value: () => password.get(),
              onInput: (e: any) => password.set(e.target.value)
            }),
            ui.when(
              () => passwordError.get(),
              (err) => ui.element("div", { style: "color: var(--color-danger); font-size: 12px; margin-top: 4px;" }, err)
            )
          ),

          // Terms Checkbox
          ui.element(
            "div",
            { style: "margin-bottom: 20px;" },
            ui.element(
              "label",
              { style: "display: flex; align-items: center; gap: 8px; font-size: 13px; cursor: pointer;" },
              ui.element("input", {
                type: "checkbox",
                checked: () => agreeTerms.get(),
                onChange: (e: any) => agreeTerms.set(e.target.checked)
              }),
              "I agree to the terms and privacy policy"
            )
          ),

          // Submit Button
          ui.element(
            "button",
            {
              type: "submit",
              class: "btn btn-primary",
              style: "width: 100%; padding: 10px;",
              disabled: () => !isFormValid.get()
            },
            ui.text(() => (isFormValid.get() ? "Submit Account" : "Please Complete All Fields"))
          )
        )
    )
  );
});

