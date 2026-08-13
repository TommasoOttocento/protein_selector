import { AMINO_ACIDS, contrastText, type AminoAcidInfo } from "../lib/aminoAcids";
import { setDraggedAminoAcid } from "../lib/dragAminoAcid";
import Formula from "../lib/Formula";
import "./AminoAcidDock.css";

const AMINO_ACID_ENTRIES = Object.entries(AMINO_ACIDS) as [string, AminoAcidInfo][];

type AminoAcidDockProps = {
  onAdd: (code: string) => void;
};

export default function AminoAcidDock({ onAdd }: AminoAcidDockProps) {
  return (
    <aside className="aa-dock" aria-label="Amino acid dock">
      <p className="aa-dock-title">Amino acids</p>
      <p className="aa-dock-hint">Drag onto the chain, or click to append</p>
      <ul className="aa-dock-list">
        {AMINO_ACID_ENTRIES.map(([code, { name, color, formula }]) => {
          return (
            <li key={code}>
              <button
                type="button"
                className="aa-dock-item"
                draggable
                onDragStart={(event) => {
                  setDraggedAminoAcid(code);
                  event.dataTransfer.setData("text/plain", `aa:${code}`);
                  event.dataTransfer.effectAllowed = "copy";
                }}
                onDragEnd={() => setDraggedAminoAcid(null)}
                onClick={() => onAdd(code)}
              >
                <span
                  className="aa-dock-bead"
                  style={{ background: color, color: contrastText(color) }}
                >
                  {code}
                </span>
                <span className="aa-dock-meta">
                  <strong>{name}</strong>
                  <Formula className="aa-dock-formula" atoms={formula} />
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
