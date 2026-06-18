/**
 * React glue for the per-view store: a context carrying the vanilla store API
 * and a {@link useMapStore} hook that subscribes to a slice of it.
 */

import { createContext, useContext } from "react";
import { useStore } from "zustand";
import type { StoreApi } from "zustand/vanilla";
import type { MapState } from "./store";

export const StoreContext = createContext<StoreApi<MapState> | null>(null);

export function useMapStore<T>(selector: (state: MapState) => T): T {
  const store = useContext(StoreContext);
  if (!store) throw new Error("useMapStore must be used within <StoreContext>");
  return useStore(store, selector);
}

/** Access the store API directly (for actions / one-off reads outside render). */
export function useMapStoreApi(): StoreApi<MapState> {
  const store = useContext(StoreContext);
  if (!store) throw new Error("useMapStoreApi must be used within <StoreContext>");
  return store;
}
