import { useCallback, useEffect, useRef, useState, type DragEvent, type PointerEvent } from "react";
import { AMINO_ACIDS, contrastText, getAminoAcid } from "../lib/aminoAcids";
import { getDraggedAminoAcid } from "../lib/dragAminoAcid";
import Formula from "../lib/Formula";
import "./ProteinChain.css";

type ChainNode = {
  x: number;
  y: number;
  code: string;
};

export type InsertPreview = {
  at: number;
  code: string;
};

type ProteinChainProps = {
  protein: string;
  onProteinChange: (protein: string) => void;
  selectedIndex: number | null;
  onSelectedIndexChange: (index: number | null) => void;
  onInsertPreviewChange: (preview: InsertPreview | null) => void;
};

const RADIUS = 22;

function parseDroppedAminoAcid(value: string): string | null {
  const match = value.trim().match(/^aa:([A-Z])$/);
  const code = match?.[1];
  return code && code in AMINO_ACIDS ? code : null;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function layoutChain(
  codes: string[],
  width: number,
  height: number,
): { nodes: ChainNode[]; rest: number } {
  const cols = Math.max(1, Math.floor((width - 56) / 54));
  const rest = Math.min(54, (width - 56) / Math.max(1, Math.min(Math.max(codes.length, 1), cols)));
  const nodes = codes.map((code, index) => {
    const row = Math.floor(index / cols);
    const col = index % cols;
    const goingRight = row % 2 === 0;
    const x = goingRight ? 28 + col * rest : 28 + (Math.min(codes.length, cols) - 1 - col) * rest;
    const y = 36 + row * rest;
    return {
      code,
      x: clamp(x, RADIUS + 8, width - RADIUS - 8),
      y: clamp(y, RADIUS + 8, height - RADIUS - 8),
    };
  });
  return { nodes, rest };
}

function relax(
  nodes: ChainNode[],
  rest: number,
  width: number,
  height: number,
  pinned: number | null,
): void {
  const minX = RADIUS + 8;
  const maxX = width - RADIUS - 8;
  const minY = RADIUS + 8;
  const maxY = height - RADIUS - 8;

  for (let pass = 0; pass < 10; pass += 1) {
    for (let i = 0; i < nodes.length - 1; i += 1) {
      const a = nodes[i];
      const b = nodes[i + 1];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const distance = Math.hypot(dx, dy) || 0.001;
      const shift = ((distance - rest) / distance) * 0.5;
      const ox = dx * shift;
      const oy = dy * shift;
      if (i !== pinned) {
        a.x += ox;
        a.y += oy;
      }
      if (i + 1 !== pinned) {
        b.x -= ox;
        b.y -= oy;
      }
    }

    for (let i = 0; i < nodes.length; i += 1) {
      if (i === pinned) {
        continue;
      }
      nodes[i].x = clamp(nodes[i].x, minX, maxX);
      nodes[i].y = clamp(nodes[i].y, minY, maxY);
    }
  }

  if (pinned !== null) {
    nodes[pinned].x = clamp(nodes[pinned].x, minX, maxX);
    nodes[pinned].y = clamp(nodes[pinned].y, minY, maxY);
  }
}

function insertIndexAt(nodes: ChainNode[], x: number, y: number): number {
  if (nodes.length === 0) {
    return 0;
  }

  let best = 0;
  let bestDistance = Number.POSITIVE_INFINITY;
  nodes.forEach((node, index) => {
    const distance = Math.hypot(node.x - x, node.y - y);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = index;
    }
  });

  const nearest = nodes[best];
  const next = nodes[best + 1];
  if (!next) {
    return x >= nearest.x ? nodes.length : best;
  }

  const closerToNext = Math.hypot(next.x - x, next.y - y) < Math.hypot(nearest.x - x, nearest.y - y);
  return closerToNext ? best + 1 : best;
}

function previewPoint(nodes: ChainNode[], at: number, width: number, height: number): { x: number; y: number } {
  if (nodes.length === 0) {
    return { x: width / 2, y: height / 2 };
  }
  if (at <= 0) {
    return { x: clamp(nodes[0].x - 48, RADIUS + 8, width - RADIUS - 8), y: nodes[0].y };
  }
  if (at >= nodes.length) {
    const last = nodes[nodes.length - 1];
    return { x: clamp(last.x + 48, RADIUS + 8, width - RADIUS - 8), y: last.y };
  }
  const previous = nodes[at - 1];
  const next = nodes[at];
  return { x: (previous.x + next.x) / 2, y: (previous.y + next.y) / 2 };
}

export default function ProteinChain({
  protein,
  onProteinChange,
  selectedIndex,
  onSelectedIndexChange,
  onInsertPreviewChange,
}: ProteinChainProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const nodesRef = useRef<ChainNode[]>([]);
  const restRef = useRef(54);
  const dragRef = useRef<number | null>(null);
  const frameRef = useRef<number | null>(null);
  const proteinRef = useRef(protein);
  const pendingInsertRef = useRef<{ code: string; x: number; y: number; at: number } | null>(null);
  const pendingMoveRef = useRef<number | null>(null);
  const hideTimerRef = useRef<number | null>(null);
  const [nodes, setNodes] = useState<ChainNode[]>([]);
  const [dropActive, setDropActive] = useState(false);
  const [preview, setPreview] = useState<{ at: number; code: string; x: number; y: number } | null>(null);
  const [size, setSize] = useState({ width: 800, height: 360 });

  const commit = useCallback(() => {
    setNodes(nodesRef.current.map((node) => ({ ...node })));
  }, []);

  const relayout = useCallback(() => {
    const { nodes: next, rest } = layoutChain(protein.split(""), size.width, size.height);
    restRef.current = rest;
    nodesRef.current = next;
    commit();
  }, [commit, protein, size.height, size.width]);

  function cancelHide() {
    if (hideTimerRef.current !== null) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }

  function scheduleHide() {
    cancelHide();
    hideTimerRef.current = window.setTimeout(() => {
      onSelectedIndexChange(null);
    }, 180);
  }

  useEffect(() => {
    const element = stageRef.current;
    if (!element) {
      return;
    }
    const observer = new ResizeObserver((entries) => {
      const box = entries[0]?.contentRect;
      if (box && box.width > 0) {
        setSize({ width: box.width, height: box.height });
      }
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const previous = proteinRef.current;
    const pending = pendingInsertRef.current;
    const movedFrom = pendingMoveRef.current;

    if (pending && protein.length === previous.length + 1) {
      const next = nodesRef.current.map((node) => ({ ...node }));
      next.splice(pending.at, 0, {
        code: pending.code,
        x: clamp(pending.x, RADIUS + 8, size.width - RADIUS - 8),
        y: clamp(pending.y, RADIUS + 8, size.height - RADIUS - 8),
      });
      relax(next, restRef.current, size.width, size.height, pending.at);
      nodesRef.current = next;
      pendingInsertRef.current = null;
      proteinRef.current = protein;
      commit();
      return;
    }

    if (
      movedFrom !== null &&
      protein.length === previous.length &&
      protein.length > 0
    ) {
      const nextIndex = protein.split("").findIndex((code, index) => code !== previous[index]);
      const target = movedFrom < nextIndex || nextIndex === -1 ? movedFrom + 1 : movedFrom - 1;
      if (target >= 0 && target < nodesRef.current.length) {
        const next = nodesRef.current.map((node) => ({ ...node }));
        const [moved] = next.splice(movedFrom, 1);
        next.splice(target, 0, moved);
        relax(next, restRef.current, size.width, size.height, target);
        nodesRef.current = next;
        pendingMoveRef.current = null;
        proteinRef.current = protein;
        commit();
        return;
      }
    }

    proteinRef.current = protein;
    relayout();
  }, [commit, protein, relayout, size.height, size.width]);

  function onPointerDown(index: number, event: PointerEvent<SVGCircleElement>) {
    event.preventDefault();
    svgRef.current?.setPointerCapture(event.pointerId);
    dragRef.current = index;
    cancelHide();
    onSelectedIndexChange(index);
  }

  function onPointerMove(event: PointerEvent<SVGSVGElement>) {
    const pinned = dragRef.current;
    if (pinned === null) {
      return;
    }
    const bounds = event.currentTarget.getBoundingClientRect();
    const next = nodesRef.current.map((node) => ({ ...node }));
    next[pinned].x = event.clientX - bounds.left;
    next[pinned].y = event.clientY - bounds.top;
    relax(next, restRef.current, size.width, size.height, pinned);
    nodesRef.current = next;
    if (frameRef.current === null) {
      frameRef.current = requestAnimationFrame(() => {
        frameRef.current = null;
        commit();
      });
    }
  }

  function onPointerUp(event: PointerEvent<SVGSVGElement>) {
    if (svgRef.current?.hasPointerCapture(event.pointerId)) {
      svgRef.current.releasePointerCapture(event.pointerId);
    }
    dragRef.current = null;
  }

  function insertAminoAcid(code: string, x: number, y: number) {
    const at = insertIndexAt(nodesRef.current, x, y);
    pendingInsertRef.current = { code, x, y, at };
    const residues = protein.split("");
    residues.splice(at, 0, code);
    onProteinChange(residues.join(""));
    onSelectedIndexChange(at);
    setPreview(null);
    onInsertPreviewChange(null);
  }

  function updatePreview(event: DragEvent<HTMLDivElement>) {
    const code = getDraggedAminoAcid() ?? parseDroppedAminoAcid(event.dataTransfer.getData("text/plain"));
    if (!code) {
      return;
    }
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - bounds.left;
    const y = event.clientY - bounds.top;
    const at = insertIndexAt(nodesRef.current, x, y);
    const point = previewPoint(nodesRef.current, at, size.width, size.height);
    const nextPreview = { at, code, x: point.x, y: point.y };
    setDropActive(true);
    setPreview(nextPreview);
    onInsertPreviewChange({ at, code });
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    const code =
      parseDroppedAminoAcid(event.dataTransfer.getData("text/plain")) ?? getDraggedAminoAcid();
    if (!code) {
      return;
    }
    event.preventDefault();
    const bounds = event.currentTarget.getBoundingClientRect();
    insertAminoAcid(code, event.clientX - bounds.left, event.clientY - bounds.top);
    setDropActive(false);
  }

  function moveSelected(delta: number) {
    if (selectedIndex === null) {
      return;
    }
    const target = selectedIndex + delta;
    if (target < 0 || target >= protein.length) {
      return;
    }
    const residues = protein.split("");
    const [moved] = residues.splice(selectedIndex, 1);
    residues.splice(target, 0, moved);
    pendingMoveRef.current = selectedIndex;
    onProteinChange(residues.join(""));
    onSelectedIndexChange(target);
  }

  const active = selectedIndex !== null ? nodes[selectedIndex] : null;
  const activeInfo = active ? getAminoAcid(active.code) : null;
  const previewInfo = preview ? getAminoAcid(preview.code) : null;

  return (
    <div className="chain-wrap">
      <div className="chain-toolbar">
        <span>Drop preview shows the insert slot. Use arrows to shift a residue.</span>
        <button type="button" onClick={relayout}>
          Reset fold
        </button>
      </div>
      <div
        className={`chain-stage${dropActive ? " drop-active" : ""}`}
        ref={stageRef}
        onDragOver={updatePreview}
        onDragLeave={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node)) {
            setDropActive(false);
            setPreview(null);
            onInsertPreviewChange(null);
          }
        }}
        onDrop={onDrop}
      >
        {nodes.length === 0 && !preview ? (
          <p className="chain-empty">Drop an amino acid here to start the chain</p>
        ) : null}
        <svg
          ref={svgRef}
          className="chain-svg"
          width={size.width}
          height={size.height}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          {nodes.slice(0, -1).map((node, index) => {
            const next = nodes[index + 1];
            return (
              <line
                key={`bond-${index}`}
                x1={node.x}
                y1={node.y}
                x2={next.x}
                y2={next.y}
                className="peptide-bond"
              />
            );
          })}
          {nodes.map((node, index) => {
            const { color } = getAminoAcid(node.code);
            const selected = selectedIndex === index;
            return (
              <g key={`res-${index}`}>
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={selected ? RADIUS + 3 : RADIUS}
                  fill={color}
                  className="residue-bead"
                  onPointerDown={(event) => onPointerDown(index, event)}
                  onPointerEnter={() => {
                    if (dragRef.current === null) {
                      cancelHide();
                      onSelectedIndexChange(index);
                    }
                  }}
                  onPointerLeave={() => {
                    if (dragRef.current === null) {
                      scheduleHide();
                    }
                  }}
                />
                <text
                  x={node.x}
                  y={node.y + 1}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={contrastText(color)}
                  className="residue-label"
                  style={{ pointerEvents: "none" }}
                >
                  {node.code}
                </text>
              </g>
            );
          })}
          {preview ? (
            <g className="insert-preview">
              <line
                x1={preview.x}
                y1={preview.y - 28}
                x2={preview.x}
                y2={preview.y + 28}
                className="insert-caret"
              />
              <circle
                cx={preview.x}
                cy={preview.y}
                r={RADIUS}
                fill={previewInfo?.color ?? "#9af0c0"}
                className="preview-bead"
              />
              <text
                x={preview.x}
                y={preview.y + 1}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={contrastText(previewInfo?.color ?? "#9af0c0")}
                className="residue-label"
              >
                {preview.code}
              </text>
            </g>
          ) : null}
        </svg>
        {active && activeInfo && selectedIndex !== null ? (
          <aside
            className="residue-card"
            style={{
              left: clamp(active.x + 18, 12, size.width - 210),
              top: clamp(active.y - 108, 12, size.height - 118),
            }}
            onPointerEnter={cancelHide}
            onPointerLeave={scheduleHide}
          >
            <div className="residue-nav">
              <button
                type="button"
                aria-label="Move left"
                disabled={selectedIndex === 0}
                onClick={() => moveSelected(-1)}
              >
                ←
              </button>
              <span className="residue-pos">
                {selectedIndex + 1}/{protein.length}
              </span>
              <button
                type="button"
                aria-label="Move right"
                disabled={selectedIndex === protein.length - 1}
                onClick={() => moveSelected(1)}
              >
                →
              </button>
            </div>
            <strong>
              {activeInfo.name}
              <span className="residue-code">{active.code}</span>
            </strong>
            <Formula className="formula" atoms={activeInfo.formula} />
          </aside>
        ) : null}
      </div>
    </div>
  );
}
