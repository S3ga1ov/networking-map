import { useEffect, useRef, useState } from "react";
import { useMapStore, useMapStoreApi } from "./StoreContext";
import { useT } from "./LangContext";
import { PERSON_COLOR_ORDER, PERSON_COLORS } from "./theme";
import type { PersonColor } from "../core/model";
import type { Point } from "../core/geometry";

interface Props {
  /** Screen position (px, relative to canvas wrap) to anchor the popup. */
  screen: Point;
}

/** Popup shown at the click point to enter ФИО and pick a color. */
export function CreatePersonPopup({ screen }: Props) {
  const api = useMapStoreApi();
  const t = useT();
  const at = useMapStore((s) => s.pendingCreate?.at ?? null);

  const [last, setLast] = useState("");
  const [first, setFirst] = useState("");
  const [patronymic, setPatronymic] = useState("");
  const [alias, setAlias] = useState("");
  const [color, setColor] = useState<PersonColor>("blue");
  const firstFieldRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    firstFieldRef.current?.focus();
  }, []);

  if (!at) return null;

  const canSubmit = last.trim().length > 0 || first.trim().length > 0;

  const submit = () => {
    if (!canSubmit) return;
    api.getState().createPerson({
      last: last.trim(),
      first: first.trim(),
      patronymic: patronymic.trim(),
      alias: alias.trim(),
      color,
      x: at.x,
      y: at.y,
    });
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      submit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      api.getState().cancelCreate();
    }
  };

  return (
    <div
      className="nm-popup nm-create-popup"
      style={{ left: screen.x, top: screen.y }}
      onPointerDown={(e) => e.stopPropagation()}
      onKeyDown={onKeyDown}
    >
      <div className="nm-popup-title">{t("create.title")}</div>
      <input
        ref={firstFieldRef}
        className="nm-input"
        placeholder={t("field.last")}
        value={last}
        onChange={(e) => setLast(e.target.value)}
      />
      <input
        className="nm-input"
        placeholder={t("field.first")}
        value={first}
        onChange={(e) => setFirst(e.target.value)}
      />
      <input
        className="nm-input"
        placeholder={t("field.patronymic")}
        value={patronymic}
        onChange={(e) => setPatronymic(e.target.value)}
      />
      <input
        className="nm-input"
        placeholder={t("field.alias")}
        title={t("field.aliasHint")}
        value={alias}
        onChange={(e) => setAlias(e.target.value)}
      />
      <div className="nm-color-row">
        {PERSON_COLOR_ORDER.map((c) => (
          <button
            key={c}
            type="button"
            title={t(`color.${c}`)}
            className={"nm-swatch" + (color === c ? " is-active" : "")}
            style={{ background: PERSON_COLORS[c].fill, borderColor: PERSON_COLORS[c].stroke }}
            onClick={() => setColor(c)}
          />
        ))}
      </div>
      <div className="nm-popup-actions">
        <button className="nm-btn" onClick={() => api.getState().cancelCreate()}>
          {t("btn.cancel")}
        </button>
        <button className="nm-btn mod-cta" disabled={!canSubmit} onClick={submit}>
          {t("btn.create")}
        </button>
      </div>
    </div>
  );
}
