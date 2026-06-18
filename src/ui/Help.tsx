import { useState } from "react";
import { useLang, useT } from "./LangContext";

/**
 * Bottom-left help button that opens a modal with usage instructions.
 */
export function Help() {
  const t = useT();
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        className="nm-help-btn"
        title={t("help.title")}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={() => setOpen(true)}
      >
        ?
      </button>
      {open && <HelpModal onClose={() => setOpen(false)} />}
    </>
  );
}

function HelpModal({ onClose }: { onClose: () => void }) {
  const t = useT();
  const lang = useLang();
  return (
    <div className="nm-modal-overlay" onPointerDown={onClose}>
      <div
        className="nm-modal"
        onPointerDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={t("help.title")}
      >
        <div className="nm-modal-head">
          <span>
            {lang === "ru"
              ? "Карта связей: легенда и логика работы"
              : "Connection map: legend and how it works"}
          </span>
          <button className="nm-icon-btn" title={t("btn.close")} onClick={onClose}>
            ×
          </button>
        </div>
        <div className="nm-modal-body">
          {lang === "ru" ? <HelpRu /> : <HelpEn />}
        </div>
      </div>
    </div>
  );
}

function HelpRu() {
  return (
    <>
      <p>
        <b>Центр — вы.</b> Всё строится вокруг вас как точки отсчёта; задача
        карты — не «заблудиться» в собственных отношениях и сделать сеть более
        продуктивной.
      </p>
      <p>
        <b>Три круга</b> (функциональные круги) показывают близость связи:
      </p>
      <ul>
        <li>
          <b>Круг поддержки</b> — внутренний, самый маленький: родственники и
          ближайшие друзья. Это связи без материального интереса, основанные на
          чистой поддержке.
        </li>
        <li>
          <b>Круг продуктивности</b> — средний: большинство стабильных связей.
          Главная задача в начале знакомства — «ввести человека в Круг
          продуктивности» и закрепить связь, чтобы она не порвалась при первом
          препятствии. Ключевое слово — стабильность.
        </li>
        <li>
          <b>Круг развития</b> — внешняя зона, «горизонт» сети, где появляются
          новые контакты, ещё не закрепившиеся.
        </li>
      </ul>
      <p>
        <b>Секторы (оси)</b> делят карту на области жизни — работа, семья,
        друзья, услуги. Это произвольные «секторы жизни» (офис, клиенты, учёба,
        досуг), и они могут быть разного размера в зависимости от того,
        насколько эта область наполнена связями. Двойной клик переименовывает
        сектор, круг или имя в центре.
      </p>
      <p>
        <b>Точки (люди):</b> один человек — одна точка. Чем важнее человек, тем
        крупнее точка; здесь же — карточка с именем, цветом и примечаниями.
        Примечания можно вынести в отдельную заметку Obsidian.
      </p>
      <p>
        <b>Связи (линии)</b> отражают характер отношений:
      </p>
      <ul>
        <li>жирная линия — интенсивные отношения;</li>
        <li>обычная линия — обычные отношения;</li>
        <li>пунктир — нерегулярные (спорадические) отношения;</li>
        <li>зелёная линия — позитивные, динамичные отношения;</li>
        <li>красная линия — отношения с проблемами.</li>
      </ul>
      <p>
        <b>Стрелки на связи</b> показывают, кто проявляет инициативу. Если
        инициатива взаимная — стрелки разнонаправленные. Этим же приёмом
        соединяют людей, которые знают друг друга, — так визуализируется
        плотность сети.
      </p>
      <p>
        <b>Плотность сети</b> — чем больше связей нарисовано между вашими
        контактами, тем выше плотность. Низкая плотность хороша, например, для
        продаж — источники держат изолированными; высокая — для команды, где
        важна совместная работа.
      </p>
      <p>
        <b>Слои</b> (слева сверху) — связи привязаны к слою, видимость
        переключается. Это позволяет смотреть на одну и ту же сеть людей под
        разными углами, например в контексте разных целей взаимодействия.
      </p>
      <p>
        <b>Легенда</b> (слева снизу) — расшифровка типов линий.
      </p>
      <p className="nm-modal-foot">
        <b>Масштаб и история</b> (панель сверху) — зум, сброс вида,
        отмена/повтор, экспорт в PNG/SVG/JSON. Всё сохраняется автоматически в
        файл карты внутри хранилища Obsidian.
      </p>
    </>
  );
}

function HelpEn() {
  return (
    <>
      <p>
        <b>You are the center.</b> Everything is built around you as the point
        of reference; the goal is to not “get lost” in your own relationships
        and to make your network more productive.
      </p>
      <p>
        <b>Three circles</b> (functional circles) show how close a connection
        is:
      </p>
      <ul>
        <li>
          <b>Support circle</b> — the innermost, smallest: family and closest
          friends. Connections with no material interest, based on pure support.
        </li>
        <li>
          <b>Productivity circle</b> — the middle one: most of your stable
          connections. Early on, the main task is to “bring a person into the
          Productivity circle” and secure the connection so it doesn't break at
          the first obstacle. The key word is stability.
        </li>
        <li>
          <b>Development circle</b> — the outer zone, the “horizon” of the
          network, where new, not-yet-established contacts appear.
        </li>
      </ul>
      <p>
        <b>Sectors (axes)</b> split the map into areas of life — work, family,
        friends, services. These are arbitrary “life sectors” (office, clients,
        study, leisure) and can be of different sizes depending on how full of
        connections an area is. Double-click renames a sector, a circle, or the
        center name.
      </p>
      <p>
        <b>Points (people):</b> one person — one point. The more important the
        person, the larger the point; the card holds the name, color and notes.
        Notes can be moved into a separate Obsidian note.
      </p>
      <p>
        <b>Connections (lines)</b> reflect the nature of the relationship:
      </p>
      <ul>
        <li>bold line — intense relationship;</li>
        <li>regular line — ordinary relationship;</li>
        <li>dashed — irregular (sporadic) relationship;</li>
        <li>green line — positive, dynamic relationship;</li>
        <li>red line — a strained relationship.</li>
      </ul>
      <p>
        <b>Arrows on a connection</b> show who takes the initiative. If it's
        mutual, the arrows point both ways. The same technique connects people
        who know each other — that's how you visualize network density.
      </p>
      <p>
        <b>Network density</b> — the more connections drawn between your
        contacts, the higher the density. Low density is good, e.g. for sales —
        you keep sources isolated; high density suits a team where collaboration
        matters.
      </p>
      <p>
        <b>Layers</b> (top-left) — connections belong to a layer, and visibility
        can be toggled. This lets you look at the same network of people from
        different angles, e.g. for different interaction goals.
      </p>
      <p>
        <b>Legend</b> (bottom-left) — what the line types mean.
      </p>
      <p className="nm-modal-foot">
        <b>Zoom and history</b> (top panel) — zoom, reset view, undo/redo,
        export to PNG/SVG/JSON. Everything is saved automatically into the map
        file inside your Obsidian vault.
      </p>
    </>
  );
}
