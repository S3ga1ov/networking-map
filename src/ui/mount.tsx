import { StrictMode } from "react";
import { createRoot, type Root } from "react-dom/client";
import type { StoreApi } from "zustand/vanilla";
import { App } from "./App";
import { StoreContext } from "./StoreContext";
import { EnvContext } from "./EnvContext";
import { LangContext } from "./LangContext";
import { makeT, type Lang } from "./i18n";
import type { MapState } from "./store";
import type { HostEnv } from "./env";

/**
 * Mount the React app into a container with a given per-view store, host
 * environment and language. Returns a {@link Root} so the caller can unmount on
 * view close.
 */
export function mountApp(
  container: HTMLElement,
  store: StoreApi<MapState>,
  env: HostEnv,
  lang: Lang,
): Root {
  const root = createRoot(container);
  root.render(
    <StrictMode>
      <LangContext.Provider value={{ lang, t: makeT(lang) }}>
        <EnvContext.Provider value={env}>
          <StoreContext.Provider value={store}>
            <App />
          </StoreContext.Provider>
        </EnvContext.Provider>
      </LangContext.Provider>
    </StrictMode>,
  );
  return root;
}
