import type { AtomCounts } from "./aminoAcids";

const ELEMENT_ORDER = ["C", "H", "N", "O", "S"] as const;

type FormulaProps = {
  atoms: AtomCounts;
  className?: string;
};

export default function Formula({ atoms, className }: FormulaProps) {
  return (
    <span className={className}>
      {ELEMENT_ORDER.map((element) => {
        const count = atoms[element];
        if (!count) {
          return null;
        }
        return (
          <span key={element}>
            {element}
            {count > 1 ? <sub>{count}</sub> : null}
          </span>
        );
      })}
    </span>
  );
}
