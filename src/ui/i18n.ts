/**
 * Tiny i18n layer. The English dictionary is canonical (its keys define the
 * allowed key set); every other language must provide the same keys. Strings
 * may contain {placeholder} tokens filled from the `vars` argument.
 */

export type Lang = "ru" | "en";

const en = {
  // create-person popup
  "create.title": "New person",
  "field.last": "Last name",
  "field.first": "First name",
  "field.patronymic": "Middle name (optional)",
  "field.patronymicShort": "Middle name",
  "field.alias": "Node label (optional)",
  "field.aliasHint": "Letters on the node come from here, e.g. мама → М, лысый чёрт → ЛЧ",
  "btn.cancel": "Cancel",
  "btn.create": "Create",
  "btn.close": "Close",
  "btn.delete": "Delete",

  // confirmations
  "confirm.delete": "Delete",
  "confirm.person": "Delete this person and all their connections?",
  "confirm.note": "Unlink this note? The file itself is not deleted.",
  "confirm.sector": "Remove this sector?",
  "confirm.layer": "Delete this layer and all its connections?",
  "confirm.connection": "Delete this connection?",

  // colors
  "color.blue": "Blue",
  "color.pink": "Pink",
  "color.gray": "Gray",

  // sizes
  "size.normal": "Normal",
  "size.important": "Important",
  "size.key": "Key",

  // person card
  "person.noName": "Unnamed",
  "link.create": "Add connection",
  "link.cancel": "Cancel connection",
  "link.pickTarget": "Click the second circle to create a connection.",
  "link.delete": "Delete connection",
  "notes.section": "Notes",
  "notes.none": "No notes linked",
  "notes.openNote": "Open note",
  "notes.unlink": "Unlink",
  "notes.create": "Create a note",
  "notes.bind": "Bind a note",

  // link styles (semantic)
  "linkstyle.bold-black": "Intense relationship",
  "linkstyle.thin-black": "Regular relationship",
  "linkstyle.dashed-black": "Irregular relationship",
  "linkstyle.thin-green": "Positive relationship",
  "linkstyle.thin-red": "Strained relationship",

  // arrows
  "arrow.none": "No arrows",
  "arrow.forward": "Initiative from the first",
  "arrow.backward": "Initiative from the second",
  "arrow.both": "Mutual initiative",

  // layers
  "layers.title": "Layers",
  "layers.visibility": "Visibility",
  "layers.makeActive": "Make active",
  "layers.delete": "Delete layer",
  "layers.add": "+ Layer",
  "layers.newName": "Layer {n}",

  // legend
  "legend.title": "Connections",

  // toolbar
  "tool.zoomOut": "Zoom out",
  "tool.zoomIn": "Zoom in",
  "tool.reset": "Reset view",
  "tool.undo": "Undo (Ctrl+Z)",
  "tool.redo": "Redo (Ctrl+Shift+Z)",
  "tool.export": "Export",
  "export.png": "Image (PNG)",
  "export.svg": "Vector (SVG)",
  "export.json": "Data (JSON)",
  "export.failed": "Export failed: {msg}",

  // help
  "help.title": "Help",

  // ribbon / commands
  "ribbon.newMap": "New connection map",

  // new-map defaults
  "doc.title": "Connection map",
  "doc.author": "You",
  "circle.trust": "Support circle",
  "circle.productivity": "Productivity circle",
  "circle.development": "Development circle",
  "sector.work": "Work",
  "sector.family": "Family",
  "sector.friends": "Friends",
  "sector.services": "Services",
  "sector.new": "New sector",
  "sector.split": "Split sector",
  "sector.remove": "Remove sector",
  "layer.default": "General connection map",
};

export type I18nKey = keyof typeof en;

const ru: Record<I18nKey, string> = {
  "create.title": "Новый человек",
  "field.last": "Фамилия",
  "field.first": "Имя",
  "field.patronymic": "Отчество (необязательно)",
  "field.patronymicShort": "Отчество",
  "field.alias": "Подпись на кружке (необязательно)",
  "field.aliasHint": "Буквы на кружке берутся отсюда, напр. мама → М, лысый чёрт → ЛЧ",
  "btn.cancel": "Отмена",
  "btn.create": "Создать",
  "btn.close": "Закрыть",
  "btn.delete": "Удалить",

  "confirm.delete": "Удалить",
  "confirm.person": "Удалить этого человека и все его связи?",
  "confirm.note": "Отвязать эту заметку? Сам файл не удаляется.",
  "confirm.sector": "Удалить этот сектор?",
  "confirm.layer": "Удалить слой и все его связи?",
  "confirm.connection": "Удалить эту связь?",

  "color.blue": "Голубой",
  "color.pink": "Розовый",
  "color.gray": "Серый",

  "size.normal": "Обычный",
  "size.important": "Важный",
  "size.key": "Ключевой",

  "person.noName": "Без имени",
  "link.create": "Создать связь",
  "link.cancel": "Отменить связь",
  "link.pickTarget": "Кликните по второму кружку, чтобы создать связь.",
  "link.delete": "Удалить связь",
  "notes.section": "Заметки",
  "notes.none": "Заметки не привязаны",
  "notes.openNote": "Открыть заметку",
  "notes.unlink": "Отвязать",
  "notes.create": "Создать заметку",
  "notes.bind": "Привязать заметку",

  "linkstyle.bold-black": "Интенсивные отношения",
  "linkstyle.thin-black": "Обычные отношения",
  "linkstyle.dashed-black": "Нерегулярные отношения",
  "linkstyle.thin-green": "Позитивные отношения",
  "linkstyle.thin-red": "Отношения с проблемами",

  "arrow.none": "Без стрелок",
  "arrow.forward": "Инициатива от первого",
  "arrow.backward": "Инициатива от второго",
  "arrow.both": "Взаимная инициатива",

  "layers.title": "Слои",
  "layers.visibility": "Видимость",
  "layers.makeActive": "Сделать активным",
  "layers.delete": "Удалить слой",
  "layers.add": "+ Слой",
  "layers.newName": "Слой {n}",

  "legend.title": "Связи",

  "tool.zoomOut": "Уменьшить",
  "tool.zoomIn": "Увеличить",
  "tool.reset": "Сбросить вид",
  "tool.undo": "Отменить (Ctrl+Z)",
  "tool.redo": "Повторить (Ctrl+Shift+Z)",
  "tool.export": "Экспорт",
  "export.png": "Картинка (PNG)",
  "export.svg": "Вектор (SVG)",
  "export.json": "Данные (JSON)",
  "export.failed": "Не удалось экспортировать: {msg}",

  "help.title": "Инструкция",

  "ribbon.newMap": "Новая карта связей",

  "doc.title": "Карта связей",
  "doc.author": "Вы",
  "circle.trust": "Круг поддержки",
  "circle.productivity": "Круг продуктивности",
  "circle.development": "Круг развития",
  "sector.work": "Работа",
  "sector.family": "Семья",
  "sector.friends": "Друзья",
  "sector.services": "Услуги",
  "sector.new": "Новый сектор",
  "sector.split": "Разделить сектор",
  "sector.remove": "Удалить сектор",
  "layer.default": "Общая схема связей",
};

const DICTS: Record<Lang, Record<I18nKey, string>> = { en, ru };

export type TFn = (key: I18nKey, vars?: Record<string, string | number>) => string;

/** Build a translation function bound to a language. */
export function makeT(lang: Lang): TFn {
  const dict = DICTS[lang] ?? en;
  return (key, vars) => {
    let s = dict[key] ?? en[key] ?? key;
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        s = s.replace(`{${k}}`, String(v));
      }
    }
    return s;
  };
}

/** Normalize an arbitrary locale code (e.g. "ru-RU") to a supported language. */
export function normalizeLang(raw: string | null | undefined): Lang {
  return raw && raw.toLowerCase().startsWith("ru") ? "ru" : "en";
}
