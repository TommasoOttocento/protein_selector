import { useCallback, useEffect, useRef, useState, type PointerEvent } from "react";
import { contrastText, getAminoAcid } from "../lib/aminoAcids";
import Formula from "../lib/Formula";
import "./ProteinChain.css";

type ChainNode = {
  x: number;
  y: number;
  code: string;
};

type ProteinChainProps = {
  protein: string;
};

const RADIUS = 22;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function layoutChain(
  codes: string[],
  width: number,
  height: number,
): { nodes: ChainNode[]; rest: number } {
  const cols = Math.max(1, Math.floor((width - 56) / 54));
  const rest = Math.min(54, (width - 56) / Math.max(1, Math.min(codes.length, cols)));
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

export default function ProteinChain({ protein }: ProteinChainProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const nodesRef = useRef<ChainNode[]>([]);
  const restRef = useRef(54);
  const dragRef = useRef<number | null>(null);
  const frameRef = useRef<number | null>(null);
  const [nodes, setNodes] = useState<ChainNode[]>([]);
  const [hover, setHover] = useState<number | null>(null);
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
    relayout();
  }, [relayout]);

  function onPointerDown(index: number, event: PointerEvent<SVGCircleElement>) {
    event.preventDefault();
    svgRef.current?.setPointerCapture(event.pointerId);
    dragRef.current = index;
    setHover(index);
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

  const active = hover !== null ? nodes[hover] : null;
  const activeInfo = active ? getAminoAcid(active.code) : null;

  return (
    <div className="chain-wrap">
      <div className="chain-toolbar">
        <span>Drag any residue to fold the chain</span>
        <button type="button" onClick={relayout}>
          Reset fold
        </button>
      </div>
      <div className="chain-stage" ref={stageRef}>
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
            const selected = hover === index;
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
                      setHover(index);
                    }
                  }}
                  onPointerLeave={() => {
                    if (dragRef.current === null) {
                      setHover(null);
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
        </svg>
        {active && activeInfo ? (
          <aside
            className="residue-card"
            style={{
              left: clamp(active.x + 18, 12, size.width - 190),
              top: clamp(active.y - 78, 12, size.height - 92),
            }}
          >
            <strong>{activeInfo.name}</strong>
            <span className="residue-code">{active.code}</span>
            <Formula className="formula" atoms={activeInfo.formula} />
          </aside>
        ) : null}
      </div>
    </div>
  );
}
