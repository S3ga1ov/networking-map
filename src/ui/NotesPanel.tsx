import { useEffect, useState } from "react";
import { useMapStore, useMapStoreApi } from "./StoreContext";
import { useEnv } from "./EnvContext";
import { useT } from "./LangContext";
import type { TFn } from "./i18n";
import { fullName } from "../core/geometry";
import {
  deletePerson,
  renamePerson,
  setColor,
  setNotes,
  setNotePath,
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

/** Right-side panel for the selected person: edit, link, notes. */
export function NotesPanel() {
  const api = useMapStoreApi();
  const env = useEnv();
  const t = useT();
  const person = useMapStore((s) =>
    s.doc.people.find((p) => p.id === s.selectedPersonId) ?? null,
  );
  const linking = useMapStore((s) => s.mode === "link");

  const [notesDraft, setNotesDraft] = useState("");
  const [choosingStyle, setChoosingStyle] = useState(false);
  const [notePreview, setNotePreview] = useState<string | null>(null);

  useEffect(() => {
    setNotesDraft(person?.notes ?? "");
    setChoosingStyle(false);
  }, [person?.id]);

  const notePath = person?.notePath ?? null;
  useEffect(() => {
    let cancelled = false;
    if (notePath) {
      void env.readNote(notePath).then((c) => {
        if (!cancelled) setNotePreview(c === null ? null : stripFrontmatter(c));
      });
    } else {
      setNotePreview(null);
    }
    return () => {
      cancelled = true;
    };
  }, [notePath, env]);

  // Auto-bind a note when exactly one in the folder matches the person's name
  // (and no inline notes would be lost). Multiple matches → use manual bind.
  const personId = person?.id;
  const personName = person ? fullName(person) : "";
  const hasInlineNotes = (person?.notes ?? "").trim().length > 0;
  useEffect(() => {
    if (!personId || notePath || !personName || hasInlineNotes) return;
    let cancelled = false;
    void env.findPersonNote(personName).then((res) => {
      if (cancelled || res.kind !== "one" || !res.path) return;
      api.getState().apply((doc) => setNotePath(doc, personId, res.path!));
    });
    return () => {
      cancelled = true;
    };
  }, [personId, notePath, personName, hasInlineNotes, env, api]);

  if (!person) return null;

  const name = fullName(person) || t("person.noName");

  const commitNotes = () => {
    if (notesDraft !== person.notes) {
      api.getState().apply((doc) => setNotes(doc, person.id, notesDraft));
    }
  };

  const onColor = (c: PersonColor) =>
    api.getState().apply((doc) => setColor(doc, person.id, c));

  const onDelete = () => {
    api.getState().apply((doc) => deletePerson(doc, person.id));
    api.getState().selectPerson(null);
  };

  const onPickStyle = (style: (typeof LINK_STYLE_ORDER)[number]) => {
    api.getState().setLinkStyle(style);
    api.getState().startLink(person.id);
    setChoosingStyle(false);
  };

  const bindNote = async () => {
    const path = await env.pickNote();
    if (path) api.getState().apply((doc) => setNotePath(doc, person.id, path));
  };

  const promoteToNote = async () => {
    const ref = await env.openPersonNote({
      personId: person.id,
      displayName: name,
      seedBody: person.notes ? person.notes + "\n" : `# ${name}\n\n`,
      frontmatter: {
        "nm-color": person.color,
        "nm-x": Math.round(person.x),
        "nm-y": Math.round(person.y),
      },
    });
    api.getState().apply((doc) => setNotePath(doc, person.id, ref.path));
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
        <button className="nm-btn mod-warning" onClick={onDelete}>
          {t("btn.delete")}
        </button>
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
        <div className="nm-notes-label">{t("notes.label")}</div>
        {person.notePath ? (
          <div className="nm-note-ref">
            <span className="nm-note-path">{person.notePath}</span>
            <div className="nm-note-preview">
              {notePreview === null
                ? "…"
                : notePreview.trim() || t("notes.empty")}
            </div>
            <div className="nm-panel-actions">
              <button
                className="nm-btn"
                onClick={() => void env.revealNote(person.notePath!)}
              >
                {t("notes.openNote")}
              </button>
              <button
                className="nm-btn"
                onClick={() =>
                  api.getState().apply((doc) => setNotePath(doc, person.id, null))
                }
              >
                {t("notes.unlink")}
              </button>
            </div>
          </div>
        ) : (
          <>
            <textarea
              className="nm-notes-area"
              placeholder={t("notes.placeholder")}
              value={notesDraft}
              onChange={(e) => setNotesDraft(e.target.value)}
              onBlur={commitNotes}
            />
            <div className="nm-panel-actions">
              <button className="nm-btn" onClick={() => void promoteToNote()}>
                {t("notes.toNote")}
              </button>
              <button className="nm-btn" onClick={() => void bindNote()}>
                {t("notes.bind")}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/** Drop a leading YAML frontmatter block for a cleaner preview. */
function stripFrontmatter(md: string): string {
  if (md.startsWith("---")) {
    const end = md.indexOf("\n---", 3);
    if (end !== -1) {
      const after = md.indexOf("\n", end + 1);
      return after !== -1 ? md.slice(after + 1) : "";
    }
  }
  return md;
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
