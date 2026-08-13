import ProteinChain from "./ProteinChain";
import { getAminoAcid } from "../lib/aminoAcids";
import Formula from "../lib/Formula";
import "./ProteinImpression.css";

type ProteinImpressionProps = {
  protein: string;
};

export default function ProteinImpression({ protein }: ProteinImpressionProps) {
  const residues = protein.split("");
  const used = [...new Set(residues)];

  if (residues.length === 0) {
    return <p className="protein mono">(empty)</p>;
  }

  return (
    <div className="impression">
      <p className="protein-text mono" aria-label="Amino acid sequence">
        {residues.map((code, index) => {
          const { name, color } = getAminoAcid(code);
          return (
            <span
              key={`text-${index}`}
              className="protein-letter"
              style={{ color }}
              title={name}
            >
              {code}
            </span>
          );
        })}
      </p>

      <ProteinChain protein={protein} />

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
    </div>
  );
}
