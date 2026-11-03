/**
 * @mbuf/renderer
 * Targeted direct DOM rendering engine with recursive node disposal,
 * keyed list reconciliation, and reactive bindings.
 */

import { effect, registerCleanup } from "../../runtime/src/index.ts";

export type ChildNode = Node | string | number | boolean | null | undefined | (() => any) | ChildNode[];

export interface ElementProps {
  [key: string]: any;
  class?: string | Record<string, boolean> | (() => any);
  style?: string | Record<string, string> | (() => any);
  children?: ChildNode | ChildNode[];
}

/**
 * Attaches a disposal callback to a DOM node.
 */
export function attachCleanup(node: Node, cleanup: () => void): void {
  const nodeWithCleanups = node as any;
  if (!nodeWithCleanups.__mbuf_cleanups__) {
    nodeWithCleanups.__mbuf_cleanups__ = [];
  }
  nodeWithCleanups.__mbuf_cleanups__.push(cleanup);
}

/**
 * Recursively runs all cleanups on a node and its descendants.
 * Critical for preventing memory leaks when elements are removed from the DOM.
 */
export function disposeTree(node: Node): void {
  const nodeWithCleanups = node as any;
  if (nodeWithCleanups.__mbuf_cleanups__) {
    const cleanups: (() => void)[] = nodeWithCleanups.__mbuf_cleanups__;
    for (let i = 0; i < cleanups.length; i++) {
      try {
        cleanups[i]();
      } catch (err) {
        console.error("[mbuf/renderer] Error in node disposal:", err);
      }
    }
    nodeWithCleanups.__mbuf_cleanups__ = null;
  }

  // Traverse children
  let child = node.firstChild;
  while (child) {
    disposeTree(child);
    child = child.nextSibling;
  }
}

/**
 * Creates a reactive text node. Directly updates text content when cell dependencies mutate.
 */
export function text(content: string | number | (() => string | number | boolean | null | undefined)): Text {
  if (typeof content === "function") {
    const node = document.createTextNode("");
    const dispose = effect(() => {
      const val = content();
      node.data = val === null || val === undefined ? "" : String(val);
    });
    attachCleanup(node, dispose);
    return node;
  }
  return document.createTextNode(String(content));
}

/**
 * Creates a native DOM element with reactive attributes, properties, and event listeners.
 */
export function element<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props?: ElementProps | null,
  ...children: ChildNode[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);

  if (props) {
    for (const [key, val] of Object.entries(props)) {
      if (key === "children") continue;

      if (key.startsWith("on") && typeof val === "function") {
        // Event listener: onClick -> click
        const eventName = key.slice(2).toLowerCase();
        el.addEventListener(eventName, val);
        attachCleanup(el, () => el.removeEventListener(eventName, val));
      } else if (key === "class" || key === "className") {
        bindClass(el, val);
      } else if (key === "style") {
        bindStyle(el, val);
      } else if (typeof val === "function") {
        // Reactive attribute/property binding
        const dispose = effect(() => {
          const currentVal = val();
          applyProp(el, key, currentVal);
        });
        attachCleanup(el, dispose);
      } else {
        applyProp(el, key, val);
      }
    }

    if (props.children) {
      appendChildren(el, props.children);
    }
  }

  if (children.length > 0) {
    appendChildren(el, children);
  }

  return el;
}

function applyProp(el: HTMLElement, key: string, val: any): void {
  if (key === "value" && "value" in el) {
    (el as any).value = val ?? "";
  } else if (key === "checked" && "checked" in el) {
    (el as any).checked = Boolean(val);
  } else if (key === "disabled" && "disabled" in el) {
    (el as any).disabled = Boolean(val);
  } else if (val === false || val === null || val === undefined) {
    el.removeAttribute(key);
  } else {
    el.setAttribute(key, String(val));
  }
}

function bindClass(el: HTMLElement, val: any): void {
  if (typeof val === "function") {
    const dispose = effect(() => {
      const current = val();
      applyClass(el, current);
    });
    attachCleanup(el, dispose);
  } else {
    applyClass(el, val);
  }
}

function applyClass(el: HTMLElement, val: any): void {
  if (typeof val === "string") {
    el.className = val;
  } else if (typeof val === "object" && val !== null) {
    const classes: string[] = [];
    for (const [k, v] of Object.entries(val)) {
      if (Boolean(v)) classes.push(k);
    }
    el.className = classes.join(" ");
  }
}

function bindStyle(el: HTMLElement, val: any): void {
  if (typeof val === "function") {
    const dispose = effect(() => {
      const current = val();
      applyStyle(el, current);
    });
    attachCleanup(el, dispose);
  } else {
    applyStyle(el, val);
  }
}

function applyStyle(el: HTMLElement, val: any): void {
  if (typeof val === "string") {
    el.style.cssText = val;
  } else if (typeof val === "object" && val !== null) {
    for (const [k, v] of Object.entries(val)) {
      (el.style as any)[k] = v ?? "";
    }
  }
}

function appendChildren(parent: Node, child: ChildNode): void {
  if (Array.isArray(child)) {
    for (let i = 0; i < child.length; i++) {
      appendChildren(parent, child[i]);
    }
  } else if (child instanceof Node) {
    parent.appendChild(child);
  } else if (typeof child === "function") {
    const dynamicNode = text(child as () => any);
    parent.appendChild(dynamicNode);
  } else if (child !== null && child !== undefined && typeof child !== "boolean") {
    parent.appendChild(document.createTextNode(String(child)));
  }
}

/**
 * Creates a DocumentFragment containing multiple child nodes.
 */
export function fragment(...children: ChildNode[]): DocumentFragment {
  const frag = document.createDocumentFragment();
  appendChildren(frag, children);
  return frag;
}

/**
 * Reactive conditional rendering.
 * Swaps between thenNode and elseNode without touching surrounding DOM.
 */
export function when<T>(
  condition: () => T,
  thenBranch: (val: NonNullable<T>) => Node | ChildNode[],
  elseBranch?: () => Node | ChildNode[]
): Node {
  const marker = document.createComment("mbuf:when");
  let currentNode: Node | null = null;

  function clearBranch() {
    if (currentNode) {
      disposeTree(currentNode);
      if (currentNode.parentNode) {
        currentNode.parentNode.removeChild(currentNode);
      }
      currentNode = null;
    }
  }

  const dispose = effect(() => {
    const cond = condition();
    clearBranch();

    let nodeToInsert: Node | null = null;

    if (cond) {
      const content = thenBranch(cond as NonNullable<T>);
      nodeToInsert = normalizeToNode(content);
    } else if (elseBranch) {
      const content = elseBranch();
      nodeToInsert = normalizeToNode(content);
    }

    if (nodeToInsert && marker.parentNode) {
      marker.parentNode.insertBefore(nodeToInsert, marker);
      currentNode = nodeToInsert;
    }
  });

  attachCleanup(marker, () => {
    dispose();
    clearBranch();
  });
  registerCleanup(() => {
    dispose();
    clearBranch();
  });

  return marker;
}

function normalizeToNode(child: Node | ChildNode[]): Node {
  if (child instanceof Node) return child;
  const frag = document.createDocumentFragment();
  appendChildren(frag, child);
  return frag;
}

/**
 * Reactive keyed list rendering.
 * Reconciles array changes with minimal DOM moves and complete tree cleanup.
 */
export function each<T>(
  items: () => T[],
  renderItem: (item: T, index: number) => Node,
  keyFn?: (item: T, index: number) => any
): Node {
  const marker = document.createComment("mbuf:each");
  const nodeMap = new Map<any, { key: any; node: Node; item: T }>();

  function cleanupAll() {
    for (const entry of nodeMap.values()) {
      disposeTree(entry.node);
      if (entry.node.parentNode) {
        entry.node.parentNode.removeChild(entry.node);
      }
    }
    nodeMap.clear();
  }

  const dispose = effect(() => {
    const list = items() || [];
    const parent = marker.parentNode;
    if (!parent) return;

    const nextKeys = new Set<any>();
    const nextEntries: { key: any; node: Node; item: T }[] = [];

    for (let i = 0; i < list.length; i++) {
      const item = list[i];
      const key = keyFn ? keyFn(item, i) : i;
      nextKeys.add(key);

      const existing = nodeMap.get(key);
      if (existing) {
        nextEntries.push(existing);
      } else {
        const newNode = renderItem(item, i);
        nextEntries.push({ key, node: newNode, item });
      }
    }

    // 1. Remove and recursively dispose obsolete keys
    for (const [key, entry] of nodeMap.entries()) {
      if (!nextKeys.has(key)) {
        disposeTree(entry.node);
        if (entry.node.parentNode) {
          entry.node.parentNode.removeChild(entry.node);
        }
        nodeMap.delete(key);
      }
    }

    // 2. Re-order / Insert into DOM before marker (backwards walk)
    let refNode: Node = marker;
    for (let i = nextEntries.length - 1; i >= 0; i--) {
      const entry = nextEntries[i];
      nodeMap.set(entry.key, entry);

      if (entry.node.nextSibling !== refNode) {
        parent.insertBefore(entry.node, refNode);
      }
      refNode = entry.node;
    }
  });

  attachCleanup(marker, () => {
    dispose();
    cleanupAll();
  });
  registerCleanup(() => {
    dispose();
    cleanupAll();
  });

  return marker;
}

/**
 * Mounts a component or node to a DOM container.
 * Returns an unmount function that disposes of all reactive subscriptions and listeners.
 */
export function mount(rootNode: Node | (() => Node), container: HTMLElement | string): () => void {
  const target = typeof container === "string" ? document.querySelector<HTMLElement>(container) : container;
  if (!target) {
    throw new Error(`Mount target not found: ${container}`);
  }

  // Dispose previous contents
  while (target.firstChild) {
    disposeTree(target.firstChild);
    target.removeChild(target.firstChild);
  }

  const node = typeof rootNode === "function" ? rootNode() : rootNode;
  target.appendChild(node);

  return () => {
    disposeTree(node);
    if (node.parentNode === target) {
      target.removeChild(node);
    }
  };
}

export { renderToString } from "./ssr.ts";

