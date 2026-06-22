import { createContext, useContext } from "react";
import { type HostEnv, noopEnv } from "./env";

export const EnvContext = createContext<HostEnv>(noopEnv);

export function useEnv(): HostEnv {
  return useContext(EnvContext);
}
