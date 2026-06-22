import { useMapStore } from "../StoreContext";
import { PersonNode } from "./PersonNode";
import type { Point } from "../../core/geometry";

interface Props {
  center: Point;
  svg: React.RefObject<SVGSVGElement>;
}

/** Renders every person node in world space. */
export function PeopleLayer({ center, svg }: Props) {
  const people = useMapStore((s) => s.doc.people);
  return (
    <g className="nm-people">
      {people.map((p) => (
        <PersonNode key={p.id} person={p} center={center} svg={svg} />
      ))}
    </g>
  );
}
