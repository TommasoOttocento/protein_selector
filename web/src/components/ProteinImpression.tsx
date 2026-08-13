import { useState } from "react";
import AminoAcidDock from "./AminoAcidDock";
import ProteinChain, { type InsertPreview } from "./ProteinChain";
import { getAminoAcid } from "../lib/aminoAcids";
import { downloadTextFile, formatFasta } from "../lib/fasta";
import Formula from "../lib/Formula";
import { reverseTranslate, type SequenceKind } from "../lib/translate";
import "./ProteinImpression.css";

type ProteinImpressionProps = {
  header: string;
  kind: SequenceKind;
  protein: string;
  onProteinChange: (protein: string) => void;
};

export default function ProteinImpression({
  header,
  kind,
  protein,
  onProteinChange,
}: ProteinImpressionProps) {
  const residues = protein.split("").filter(Boolean);
  const used = [...new Set(residues)];
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [insertPreview, setInsertPreview] = useState<InsertPreview | null>(null);

  function appendAminoAcid(code: string) {
    onProteinChange(`${protein}${code}`);
    setSelectedIndex(protein.length);
  }

  function exportAminoAcids() {
    const fasta = formatFasta(`${header} amino acids`, protein);
    downloadTextFile(`${safeName(header)}.aa.fasta`, fasta);
  }

  function exportNucleotides() {
    const sequence = reverseTranslate(protein, kind);
    const fasta = formatFasta(`${header} reverse-translated ${kind}`, sequence);
    downloadTextFile(`${safeName(header)}.${kind.toLowerCase()}.fasta`, fasta);
  }

  const previewLetters = [...residues];
  if (insertPreview) {
    previewLetters.splice(insertPreview.at, 0, insertPreview.code);
  }

  return (
    <div className="impression">
      {previewLetters.length > 0 ? (
        <p className="protein-text mono" aria-label="Amino acid sequence">
          {previewLetters.map((code, index) => {
            const { name, color } = getAminoAcid(code);
            const isPreview = Boolean(
              insertPreview && index === insertPreview.at,
            );
            const sequenceIndex = insertPreview && index > insertPreview.at ? index - 1 : index;
            const isSelected = !isPreview && selectedIndex === sequenceIndex;
            return (
              <span
                key={`text-${index}-${code}`}
                className={`protein-letter${isPreview ? " is-preview" : ""}${isSelected ? " is-selected" : ""}`}
                style={{ color }}
                title={name}
              >
                {code}
              </span>
            );
          })}
        </p>
      ) : (
        <p className="protein-text muted">Empty chain — add amino acids from the dock</p>
      )}

      <div className="workspace">
        <AminoAcidDock onAdd={appendAminoAcid} />
        <ProteinChain
          protein={protein}
          onProteinChange={onProteinChange}
          selectedIndex={selectedIndex}
          onSelectedIndexChange={setSelectedIndex}
          onInsertPreviewChange={setInsertPreview}
        />
      </div>

      <div className="export-bar">
        <button type="button" className="ghost" disabled={protein.length === 0} onClick={exportAminoAcids}>
          Export FASTA as amino acids
        </button>
        <button type="button" className="ghost" disabled={protein.length === 0} onClick={exportNucleotides}>
          Export FASTA as nucleotides ({kind})
        </button>
      </div>

      {used.length > 0 ? (
        <ul className="legend">
          {used.map((code) => {
            const { name, color, formula } = getAminoAcid(code);
            return (
              <li key={code}>
                <span className="swatch" style={{ background: color }} />
                <span>
                  {code} {name} · <Formula atoms={formula} />
                </span>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

function safeName(header: string): string {
  const cleaned = header.replace(/[^\w.-]+/g, "_").replace(/^_+|_+$/g, "");
  return cleaned || "sequence";
}
