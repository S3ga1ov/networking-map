import { useEffect, useState } from "react";
import { useMapStore, useMapStoreApi } from "./StoreContext";
import { useEnv } from "./EnvContext";
import { useT } from "./LangContext";
import { useConfirm } from "./ConfirmContext";
import type { TFn } from "./i18n";
import { fullName } from "../core/geometry";
import {
  addNoteLink,
  deletePerson,
  removeNoteLink,
  renamePerson,
  setAlias,
  setColor,
  setSize,
} from "../core/commands";
import {
  LINK_STYLES,
  LINK_STYLE_ORDER,
  PERSON_COLOR_ORDER,
  PERSON_COLORS,
  PERSON_SIZE_ORDER,
} from "./theme";
import type { PersonColor, PersonSize } from "../core/model";

const SIZE_DOT: Record<PersonSize, number> = { normal: 8, important: 11, key: 14 };

/** Vault path → display name (basename without the .md extension). */
function noteName(path: string): string {
  return (path.split("/").pop() ?? path).replace(/\.md$/i, "");
}

/** Right-side panel for the selected person: edit, link people, link notes. */
export function NotesPanel() {
  const api = useMapStoreApi();
  const env = useEnv();
  const t = useT();
  const confirm = useConfirm();
  const person = useMapStore((s) =>
    s.doc.people.find((p) => p.id === s.selectedPersonId) ?? null,
  );
  const linking = useMapStore((s) => s.mode === "link");

  const [choosingStyle, setChoosingStyle] = useState(false);
  useEffect(() => {
    setChoosingStyle(false);
  }, [person?.id]);

  if (!person) return null;

  const name = fullName(person) || t("person.noName");

  const onColor = (c: PersonColor) =>
    api.getState().apply((doc) => setColor(doc, person.id, c));

  const onDelete = async () => {
    if (!(await confirm({ message: t("confirm.person") }))) return;
    api.getState().apply((doc) => deletePerson(doc, person.id));
    api.getState().selectPerson(null);
  };

  const onUnlink = async (path: string) => {
    if (!(await confirm({ message: t("confirm.note") }))) return;
    api.getState().apply((doc) => removeNoteLink(doc, person.id, path));
  };

  const onPickStyle = (style: (typeof LINK_STYLE_ORDER)[number]) => {
    api.getState().setLinkStyle(style);
    api.getState().startLink(person.id);
    setChoosingStyle(false);
  };

  const createNote = async () => {
    const ref = await env.openPersonNote({
      displayName: name,
      seedBody: `# ${name}\n\n`,
    });
    api.getState().apply((doc) => addNoteLink(doc, person.id, ref.path));
  };

  const bindNote = async () => {
    const path = await env.pickNote();
    if (path) api.getState().apply((doc) => addNoteLink(doc, person.id, path));
  };

  return (
    <div className="nm-side-panel" onPointerDown={(e) => e.stopPropagation()}>
      <div className="nm-panel-head">
        <span className="nm-panel-name">{name}</span>
        <button
          className="nm-icon-btn"
          title={t("btn.close")}
          onClick={() => api.getState().selectPerson(null)}
        >
          ×
        </button>
      </div>

      <NameFields
        last={person.last}
        first={person.first}
        patronymic={person.patronymic}
        t={t}
        onChange={(parts) =>
          api.getState().apply((doc) => renamePerson(doc, person.id, parts))
        }
      />

      <input
        className="nm-input"
        placeholder={t("field.alias")}
        title={t("field.aliasHint")}
        value={person.alias}
        onChange={(e) =>
          api.getState().apply((doc) => setAlias(doc, person.id, e.target.value))
        }
      />

      <div className="nm-color-row">
        {PERSON_COLOR_ORDER.map((c) => (
          <button
            key={c}
            type="button"
            title={t(`color.${c}`)}
            className={"nm-swatch" + (person.color === c ? " is-active" : "")}
            style={{ background: PERSON_COLORS[c].fill, borderColor: PERSON_COLORS[c].stroke }}
            onClick={() => onColor(c)}
          />
        ))}
      </div>

      <div className="nm-size-row">
        {PERSON_SIZE_ORDER.map((sz) => (
          <button
            key={sz}
            type="button"
            className={"nm-size-btn" + (person.size === sz ? " is-active" : "")}
            onClick={() => api.getState().apply((doc) => setSize(doc, person.id, sz))}
          >
            <span
              className="nm-size-dot"
              style={{ width: SIZE_DOT[sz], height: SIZE_DOT[sz] }}
            />
            {t(`size.${sz}`)}
          </button>
        ))}
      </div>

      <div className="nm-panel-actions">
        {linking ? (
          <button className="nm-btn" onClick={() => api.getState().cancelLink()}>
            {t("link.cancel")}
          </button>
        ) : (
          <button className="nm-btn" onClick={() => setChoosingStyle((v) => !v)}>
            {t("link.create")}
          </button>
        )}
      </div>

      {choosingStyle && (
        <div className="nm-style-list">
          {LINK_STYLE_ORDER.map((style) => (
            <button
              key={style}
              className="nm-style-item"
              onClick={() => onPickStyle(style)}
            >
              <LinkSwatch style={style} />
              <span>{t(`linkstyle.${style}`)}</span>
            </button>
          ))}
        </div>
      )}

      {linking && <div className="nm-hint">{t("link.pickTarget")}</div>}

      <div className="nm-notes-section">
        <div className="nm-notes-label">{t("notes.section")}</div>
        {person.notePaths.length > 0 ? (
          <ul className="nm-note-list">
            {person.notePaths.map((p) => (
              <li key={p} className="nm-note-item">
                <button
                  className="nm-note-open"
                  title={t("notes.openNote")}
                  onClick={() => void env.revealNote(p)}
                >
                  {noteName(p)}
                </button>
                <button
                  className="nm-icon-btn nm-note-remove"
                  title={t("notes.unlink")}
                  onClick={() => void onUnlink(p)}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="nm-note-empty">{t("notes.none")}</div>
        )}
        <div className="nm-panel-actions">
          <button className="nm-btn" onClick={() => void createNote()}>
            {t("notes.create")}
          </button>
          <button className="nm-btn" onClick={() => void bindNote()}>
            {t("notes.bind")}
          </button>
        </div>
      </div>

      <div className="nm-panel-delete">
        <button className="nm-btn mod-warning" onClick={() => void onDelete()}>
          {t("btn.delete")}
        </button>
      </div>
    </div>
  );
}

function NameFields(props: {
  last: string;
  first: string;
  patronymic: string;
  t: TFn;
  onChange: (parts: { last: string; first: string; patronymic: string }) => void;
}) {
  const { last, first, patronymic, t, onChange } = props;
  return (
    <div className="nm-name-fields">
      <input
        className="nm-input"
        placeholder={t("field.last")}
        value={last}
        onChange={(e) => onChange({ last: e.target.value, first, patronymic })}
      />
      <input
        className="nm-input"
        placeholder={t("field.first")}
        value={first}
        onChange={(e) => onChange({ last, first: e.target.value, patronymic })}
      />
      <input
        className="nm-input"
        placeholder={t("field.patronymicShort")}
        value={patronymic}
        onChange={(e) => onChange({ last, first, patronymic: e.target.value })}
      />
    </div>
  );
}

function LinkSwatch({ style }: { style: (typeof LINK_STYLE_ORDER)[number] }) {
  const s = LINK_STYLES[style];
  return (
    <svg width={36} height={12} className="nm-link-swatch">
      <line
        x1={2}
        y1={6}
        x2={34}
        y2={6}
        stroke={s.stroke}
        strokeWidth={s.width}
        strokeDasharray={s.dash}
      />
    </svg>
  );
}
