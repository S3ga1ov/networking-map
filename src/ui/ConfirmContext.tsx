import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { useT } from "./LangContext";

export interface ConfirmOptions {
  /** Already-localized question shown to the user. */
  message: string;
  /** Label for the confirming button (defaults to a localized "Delete"). */
  confirmLabel?: string;
}

type ConfirmFn = (opts: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn>(async () => false);

/** Ask the user to confirm a destructive action; resolves to true on confirm. */
export function useConfirm(): ConfirmFn {
  return useContext(ConfirmContext);
}

interface Pending {
  opts: ConfirmOptions;
  resolve: (ok: boolean) => void;
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<Pending | null>(null);

  const confirm = useCallback<ConfirmFn>(
    (opts) => new Promise<boolean>((resolve) => setPending({ opts, resolve })),
    [],
  );

  const settle = (ok: boolean) => {
    pending?.resolve(ok);
    setPending(null);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {pending && (
        <ConfirmDialog
          message={pending.opts.message}
          confirmLabel={pending.opts.confirmLabel}
          onCancel={() => settle(false)}
          onConfirm={() => settle(true)}
        />
      )}
    </ConfirmContext.Provider>
  );
}

function ConfirmDialog(props: {
  message: string;
  confirmLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const t = useT();
  return (
    <div
      className="nm-modal-overlay"
      onPointerDown={props.onCancel}
      onKeyDown={(e) => {
        if (e.key === "Escape") props.onCancel();
      }}
    >
      <div
        className="nm-modal nm-confirm"
        role="alertdialog"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className="nm-confirm-message">{props.message}</div>
        <div className="nm-confirm-actions">
          <button className="nm-btn" autoFocus onClick={props.onCancel}>
            {t("btn.cancel")}
          </button>
          <button className="nm-btn mod-warning" onClick={props.onConfirm}>
            {props.confirmLabel ?? t("confirm.delete")}
          </button>
        </div>
      </div>
    </div>
  );
}
