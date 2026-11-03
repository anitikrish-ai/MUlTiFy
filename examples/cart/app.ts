import { memory, ui, createComponent } from "../../packages/mbuf/src/index.js";

interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
}

interface CartItem {
  product: Product;
  quantity: number;
}

const CATALOG: Product[] = [
  { id: 1, name: "Mechanical Keyboard", price: 120, category: "Hardware" },
  { id: 2, name: "Ergonomic Mouse", price: 65, category: "Hardware" },
  { id: 3, name: "4K Monitor Arm", price: 85, category: "Accessories" },
  { id: 4, name: "Desk Pad (Wool Felt)", price: 30, category: "Accessories" }
];

export const CartApp = createComponent(() => {
  const cart = memory.cell<CartItem[]>([
    { product: CATALOG[0], quantity: 1 },
    { product: CATALOG[1], quantity: 2 }
  ]);
  const couponCode = memory.cell("");
  const appliedDiscount = memory.cell(0); // percentage, e.g. 0.1 for 10%

  const subtotal = memory.computed(() => {
    return cart.get().reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  });

  const discountAmount = memory.computed(() => {
    return subtotal.get() * appliedDiscount.get();
  });

  const total = memory.computed(() => {
    return Math.max(0, subtotal.get() - discountAmount.get());
  });

  const totalItems = memory.computed(() => {
    return cart.get().reduce((sum, item) => sum + item.quantity, 0);
  });

  const addToCart = (product: Product) => {
    cart.update((prev) => {
      const idx = prev.findIndex((i) => i.product.id === product.id);
      if (idx >= 0) {
        return prev.map((item, i) => (i === idx ? { ...item, quantity: item.quantity + 1 } : item));
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: number, delta: number) => {
    cart.update((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const nextQty = item.quantity + delta;
            return nextQty > 0 ? { ...item, quantity: nextQty } : null;
          }
          return item;
        })
        .filter((item): item is CartItem => item !== null)
    );
  };

  const applyCoupon = () => {
    const code = couponCode.get().trim().toUpperCase();
    if (code === "MBUF10") {
      appliedDiscount.set(0.1);
    } else if (code === "MBUF20") {
      appliedDiscount.set(0.2);
    } else {
      appliedDiscount.set(0);
      alert("Invalid coupon code. Try 'MBUF10' or 'MBUF20'.");
    }
  };

  return ui.element(
    "div",
    { class: "example-card", style: "max-width: 840px;" },
    ui.element("h2", null, "Reactive Shopping Cart"),

    ui.element(
      "div",
      { style: "display: grid; grid-template-columns: 1fr 1fr; gap: 24px;" },

      // Left: Catalog
      ui.element(
        "div",
        null,
        ui.element("h3", { style: "font-size: 16px; margin-bottom: 12px;" }, "Available Products"),
        ui.each(
          () => CATALOG,
          (product) =>
            ui.element(
              "div",
              { style: "display: flex; justify-content: space-between; align-items: center; padding: 10px; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 6px; margin-bottom: 8px;" },
              ui.element(
                "div",
                null,
                ui.element("div", { style: "font-weight: 500;" }, product.name),
                ui.element("div", { style: "font-size: 13px; color: var(--text-secondary);" }, `$${product.price}`)
              ),
              ui.element(
                "button",
                { class: "btn btn-primary", onClick: () => addToCart(product) },
                "+ Add"
              )
            ),
          (product) => product.id
        )
      ),

      // Right: Cart & Summary
      ui.element(
        "div",
        null,
        ui.element(
          "h3",
          { style: "font-size: 16px; margin-bottom: 12px; display: flex; justify-content: space-between;" },
          "Your Cart",
          ui.element("span", { style: "font-size: 13px; color: var(--text-secondary);" }, ui.text(() => `${totalItems.get()} items`))
        ),

        ui.when(
          () => cart.get().length === 0,
          () => ui.element("p", { style: "color: var(--text-secondary); font-size: 14px;" }, "Your cart is currently empty."),
          () =>
            ui.element(
              "div",
              null,
              ui.each(
                () => cart.get(),
                (item) =>
                  ui.element(
                    "div",
                    { style: "display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid var(--border-color);" },
                    ui.element(
                      "div",
                      null,
                      ui.element("div", { style: "font-size: 14px; font-weight: 500;" }, item.product.name),
                      ui.element("div", { style: "font-size: 12px; color: var(--text-muted);" }, `$${item.product.price} each`)
                    ),
                    ui.element(
                      "div",
                      { style: "display: flex; align-items: center; gap: 8px;" },
                      ui.element("button", { style: "padding: 2px 8px;", onClick: () => updateQuantity(item.product.id, -1) }, "-"),
                      ui.element("span", { style: "font-family: var(--font-mono); font-size: 13px;" }, String(item.quantity)),
                      ui.element("button", { style: "padding: 2px 8px;", onClick: () => updateQuantity(item.product.id, 1) }, "+")
                    )
                  ),
                (item) => item.product.id
              ),

              // Coupon code box
              ui.element(
                "div",
                { style: "display: flex; gap: 8px; margin-top: 16px;" },
                ui.element("input", {
                  type: "text",
                  placeholder: "Promo code (MBUF10)",
                  style: "flex: 1; padding: 6px 10px; font-size: 13px;",
                  value: () => couponCode.get(),
                  onInput: (e: any) => couponCode.set(e.target.value)
                }),
                ui.element("button", { class: "btn", onClick: applyCoupon }, "Apply")
              ),

              // Order Summary Table
              ui.element(
                "div",
                { style: "margin-top: 16px; padding-top: 12px; border-top: 1px solid var(--border-color); font-size: 14px;" },
                ui.element(
                  "div",
                  { style: "display: flex; justify-content: space-between; margin-bottom: 6px;" },
                  ui.element("span", null, "Subtotal"),
                  ui.element("span", { style: "font-family: var(--font-mono);" }, ui.text(() => `$${subtotal.get().toFixed(2)}`))
                ),
                ui.when(
                  () => appliedDiscount.get() > 0,
                  () =>
                    ui.element(
                      "div",
                      { style: "display: flex; justify-content: space-between; margin-bottom: 6px; color: #34d399;" },
                      ui.element("span", null, ui.text(() => `Discount (${appliedDiscount.get() * 100}%)`)),
                      ui.element("span", { style: "font-family: var(--font-mono);" }, ui.text(() => `-$${discountAmount.get().toFixed(2)}`))
                    )
                ),
                ui.element(
                  "div",
                  { style: "display: flex; justify-content: space-between; font-weight: 700; font-size: 16px; margin-top: 8px; padding-top: 8px; border-top: 1px dashed var(--border-color);" },
                  ui.element("span", null, "Order Total"),
                  ui.element("span", { style: "font-family: var(--font-mono); color: #60a5fa;" }, ui.text(() => `$${total.get().toFixed(2)}`))
                )
              )
            )
        )
      )
    )
  );
});

