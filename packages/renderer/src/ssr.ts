/**
 * @mbuf/renderer (SSR)
 * Lightweight Server-Side Rendering (SSR) HTML string emitter.
 */

import { ChildNode } from "./index.js";

/**
 * Serializes a DOM node, element, or function returning children into standard HTML string.
 */
export function renderToString(root: any): string {
  if (typeof root === "function") {
    return renderToString(root());
  }

  if (root === null || root === undefined || typeof root === "boolean") {
    return "";
  }

  if (typeof root === "string" || typeof root === "number") {
    return escapeHtml(String(root));
  }

  // If running in browser or environment with Node DOM
  if (typeof Node !== "undefined" && root instanceof Node) {
    if (root.nodeType === 3) {
      // Text node
      return escapeHtml(root.nodeValue || "");
    }
    if (root.nodeType === 8) {
      // Comment node
      return `<!--${root.nodeValue || ""}-->`;
    }
    if (root.nodeType === 1) {
      // Element node
      const el = root as HTMLElement;
      const tag = el.tagName.toLowerCase();
      const attrs: string[] = [];

      for (let i = 0; i < el.attributes.length; i++) {
        const attr = el.attributes[i];
        attrs.push(`${attr.name}="${escapeHtml(attr.value)}"`);
      }

      const attrStr = attrs.length > 0 ? " " + attrs.join(" ") : "";

      // Void tags
      if (/^(meta|link|img|br|hr|input)$/i.test(tag)) {
        return `<${tag}${attrStr} />`;
      }

      let inner = "";
      for (let i = 0; i < el.childNodes.length; i++) {
        inner += renderToString(el.childNodes[i]);
      }

      return `<${tag}${attrStr}>${inner}</${tag}>`;
    }
    if (root.nodeType === 11) {
      // DocumentFragment
      let fragHtml = "";
      for (let i = 0; i < root.childNodes.length; i++) {
        fragHtml += renderToString(root.childNodes[i]);
      }
      return fragHtml;
    }
  }

  // Fallback for arrays
  if (Array.isArray(root)) {
    return root.map(renderToString).join("");
  }

  return escapeHtml(String(root));
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

