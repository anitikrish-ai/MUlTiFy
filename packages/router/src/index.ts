/**
 * @mbuf/router
 * Reactive, fine-grained client-side router powered by MBUF memory cells.
 */

import { cell, MemoryCellHandle } from "@mbuf/memory";
import { element, when, ChildNode } from "@mbuf/renderer";
import { registerCleanup } from "@mbuf/runtime";

export interface RouteDefinition {
  path: string;
  component: (params?: Record<string, string>) => Node;
}

export interface RouterOptions {
  routes: Record<string, (params?: Record<string, string>) => Node>;
  fallback?: () => Node;
  mode?: "hash" | "history";
}

export interface RouterInstance {
  readonly currentPath: MemoryCellHandle<string>;
  navigate(path: string): void;
  Outlet(): Node;
  Link(to: string, textContent: string, className?: string): HTMLElement;
}

export function createRouter(options: RouterOptions): RouterInstance {
  const mode = options.mode || "hash";

  const getInitialPath = (): string => {
    if (typeof window === "undefined") return "/";
    if (mode === "hash") {
      return window.location.hash.slice(1) || "/";
    }
    return window.location.pathname || "/";
  };

  const currentPath = cell<string>(getInitialPath());

  if (typeof window !== "undefined") {
    const onLocationChange = () => {
      const next = mode === "hash" ? window.location.hash.slice(1) || "/" : window.location.pathname || "/";
      currentPath.set(next);
    };

    if (mode === "hash") {
      window.addEventListener("hashchange", onLocationChange);
      registerCleanup(() => window.removeEventListener("hashchange", onLocationChange));
    } else {
      window.addEventListener("popstate", onLocationChange);
      registerCleanup(() => window.removeEventListener("popstate", onLocationChange));
    }
  }

  const navigate = (path: string) => {
    if (typeof window !== "undefined") {
      if (mode === "hash") {
        window.location.hash = path;
      } else {
        window.history.pushState(null, "", path);
        currentPath.set(path);
      }
    } else {
      currentPath.set(path);
    }
  };

  const Outlet = (): Node => {
    return when(
      () => currentPath.get(),
      (path) => {
        const handler = options.routes[path];
        if (handler) {
          return handler();
        }
        if (options.fallback) {
          return options.fallback();
        }
        return element("div", { class: "router-not-found" }, `Route not found: ${path}`);
      }
    );
  };

  const Link = (to: string, textContent: string, className?: string): HTMLElement => {
    const href = mode === "hash" ? `#${to}` : to;
    return element(
      "a",
      {
        href,
        class: className || "mbuf-link",
        onClick: (e: MouseEvent) => {
          if (mode === "history") {
            e.preventDefault();
            navigate(to);
          }
        }
      },
      textContent
    );
  };

  return {
    currentPath,
    navigate,
    Outlet,
    Link
  };
}

