import { useCallback, useRef } from "react";
import { useMapStore, useMapStoreApi } from "../StoreContext";
import { initials, screenToLogical, type Point } from "../../core/geometry";
import { PERSON_COLORS, PERSON_SIZE_RADIUS } from "../theme";
import { useSurnameFirst } from "../PrefsContext";
import type { Person } from "../../core/model";

interface Props {
  person: Person;
  /** Screen-space center used to convert pointer coords to logical ones. */
  center: Point;
  svg: React.RefObject<SVGSVGElement>;
}

const CLICK_SLOP = 4;

/** A draggable, clickable person circle showing ФИ initials. */
export function PersonNode({ person, center, svg }: Props) {
  const api = useMapStoreApi();
  const selected = useMapStore((s) => s.selectedPersonId === person.id);
  const drag = useMapStore((s) =>
    s.drag?.id === person.id ? s.drag : null,
  );
  const linkMode = useMapStore((s) => s.mode === "link");
  const isLinkSource = useMapStore((s) => s.pendingLinkSource === person.id);

  const gesture = useRef<{ moved: boolean; start: Point } | null>(null);

  const x = drag ? drag.x : person.x;
  const y = drag ? drag.y : person.y;
  const palette = PERSON_COLORS[person.color];
  const radius = PERSON_SIZE_RADIUS[person.size];
  const surnameFirst = useSurnameFirst();

  const toLogical = useCallback(
    (e: { clientX: number; clientY: number }): Point => {
      const rect = svg.current?.getBoundingClientRect();
      const screen = {
        x: e.clientX - (rect?.left ?? 0),
        y: e.clientY - (rect?.top ?? 0),
      };
      return screenToLogical(screen, api.getState().viewport, center);
    },
    [api, center, svg],
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.stopPropagation();
      (e.target as Element).setPointerCapture?.(e.pointerId);
      gesture.current = {
        moved: false,
        start: { x: e.clientX, y: e.clientY },
      };
    },
    [],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const g = gesture.current;
      if (!g) return;
      const dx = e.clientX - g.start.x;
      const dy = e.clientY - g.start.y;
      if (!g.moved && Math.hypot(dx, dy) <= CLICK_SLOP) return;
      g.moved = true;
      const logical = toLogical(e);
      api.getState().dragPersonTo(person.id, logical.x, logical.y);
    },
    [api, person.id, toLogical],
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      const g = gesture.current;
      gesture.current = null;
      if (!g) return;
      const state = api.getState();
      if (g.moved) {
        state.commitDrag();
        return;
      }
      // A clean click.
      e.stopPropagation();
      if (linkMode) {
        state.completeLink(person.id);
      } else {
        state.selectPerson(person.id);
      }
    },
    [api, person.id, linkMode],
  );

  return (
    <g
      transform={`translate(${x}, ${y})`}
      className="nm-person"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      style={{ cursor: linkMode ? "crosshair" : "pointer" }}
    >
      <circle
        r={radius}
        fill={palette.fill}
        stroke={isLinkSource ? "#2e7d32" : selected ? "#3b6ea5" : palette.stroke}
        strokeWidth={selected || isLinkSource ? 3 : 1.5}
      />
      <text
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={radius * 0.68}
        fontWeight={600}
        fill={palette.text}
        style={{ pointerEvents: "none" }}
      >
        {initials(person.last, person.first, surnameFirst)}
      </text>
    </g>
  );
}
