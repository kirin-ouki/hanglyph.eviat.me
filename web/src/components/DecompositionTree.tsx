import { useState } from "react";
import type { IdsNode } from "../lib/ids";

interface Props {
  node: IdsNode;
  onSelect: (char: string) => void;
}

function Node({ node, onSelect }: Props) {
  const [open, setOpen] = useState(true);
  const hasChildren = node.children.length > 0;
  return (
    <li>
      <span className={`node${node.isEntity ? " entity" : ""}`}>
        {hasChildren && (
          <span className="op" style={{ cursor: "pointer" }} onClick={() => setOpen((o) => !o)}>
            {open ? "▾" : "▸"}
          </span>
        )}
        <span
          className="t"
          onClick={() => !node.isEntity && onSelect(node.token)}
          title={node.ids ?? undefined}
        >
          {node.token}
        </span>
        {node.ids && node.ids !== node.token && <span className="op">{node.ids}</span>}
      </span>
      {hasChildren && open && (
        <ul>
          {node.children.map((c, i) => (
            <Node key={i} node={c} onSelect={onSelect} />
          ))}
        </ul>
      )}
    </li>
  );
}

export function DecompositionTree({ node, onSelect }: Props) {
  return (
    <ul className="tree">
      <Node node={node} onSelect={onSelect} />
    </ul>
  );
}
