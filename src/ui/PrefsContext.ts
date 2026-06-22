import { createContext, useContext } from "react";

export type InitialsOrder = "first-last" | "last-first";

export interface Prefs {
  /** Order of initials on a node: "last-first" = Ф+И (default), else И+Ф. */
  initialsOrder: InitialsOrder;
}

export const DEFAULT_PREFS: Prefs = { initialsOrder: "last-first" };

export const PrefsContext = createContext<Prefs>(DEFAULT_PREFS);

export function usePrefs(): Prefs {
  return useContext(PrefsContext);
}

/** Whether the surname initial comes first, given the current prefs. */
export function useSurnameFirst(): boolean {
  return useContext(PrefsContext).initialsOrder === "last-first";
}
