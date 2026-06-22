import { useT } from "./LangContext";
import { LINK_STYLES, LINK_STYLE_ORDER } from "./theme";

/**
 * Bottom-left legend of the connection styles. Informational only (the active
 * style is chosen per-link in the notes panel), so rows are not interactive.
 */
export function Legend() {
  const t = useT();
  return (
    <div className="nm-panel nm-legend" onPointerDown={(e) => e.stopPropagation()}>
      <div className="nm-panel-title">{t("legend.title")}</div>
      {LINK_STYLE_ORDER.map((style) => {
        const s = LINK_STYLES[style];
        return (
          <div key={style} className="nm-legend-row">
            <svg width={40} height={12} aria-hidden="true">
              <line
                x1={2}
                y1={6}
                x2={38}
                y2={6}
                stroke={s.stroke}
                strokeWidth={s.width}
                strokeDasharray={s.dash}
              />
            </svg>
            <span>{t(`linkstyle.${style}`)}</span>
          </div>
        );
      })}
    </div>
  );
}
