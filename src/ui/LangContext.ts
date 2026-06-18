import { createContext, useContext } from "react";
import { makeT, type Lang, type TFn } from "./i18n";

export interface LangValue {
  lang: Lang;
  t: TFn;
}

export const LangContext = createContext<LangValue>({
  lang: "en",
  t: makeT("en"),
});

/** Current translation function. */
export function useT(): TFn {
  return useContext(LangContext).t;
}

/** Current language (for components that branch on it, e.g. the help text). */
export function useLang(): Lang {
  return useContext(LangContext).lang;
}
