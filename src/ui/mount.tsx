import { StrictMode } from "react";
import { createRoot, type Root } from "react-dom/client";
import type { StoreApi } from "zustand/vanilla";
import { App } from "./App";
import { StoreContext } from "./StoreContext";
import { EnvContext } from "./EnvContext";
import { LangContext } from "./LangContext";
import { PrefsContext, type Prefs } from "./PrefsContext";
import { ConfirmProvider } from "./ConfirmContext";
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
  prefs: Prefs,
): Root {
  const root = createRoot(container);
  root.render(
    <StrictMode>
      <LangContext.Provider value={{ lang, t: makeT(lang) }}>
        <PrefsContext.Provider value={prefs}>
          <EnvContext.Provider value={env}>
            <StoreContext.Provider value={store}>
              <ConfirmProvider>
                <App />
              </ConfirmProvider>
            </StoreContext.Provider>
          </EnvContext.Provider>
        </PrefsContext.Provider>
      </LangContext.Provider>
    </StrictMode>,
  );
  return root;
}
