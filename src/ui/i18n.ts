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
  "btn.cancel": "Cancel",
  "btn.create": "Create",
  "btn.close": "Close",
  "btn.delete": "Delete",

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
  "notes.label": "Notes",
  "notes.placeholder": "You can write anything here that’s important to know about this person",
  "notes.openNote": "Open note",
  "notes.unlink": "Unlink",
  "notes.toNote": "Move to a note",
  "notes.bind": "Bind a note",
  "notes.empty": "The note is empty.",

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
  "btn.cancel": "Отмена",
  "btn.create": "Создать",
  "btn.close": "Закрыть",
  "btn.delete": "Удалить",

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
  "notes.label": "Примечания",
  "notes.placeholder": "Здесь можно написать всё, что важно знать об этом человеке",
  "notes.openNote": "Открыть заметку",
  "notes.unlink": "Отвязать",
  "notes.toNote": "Перенести в заметку",
  "notes.bind": "Привязать заметку",
  "notes.empty": "Заметка пока пуста.",

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
