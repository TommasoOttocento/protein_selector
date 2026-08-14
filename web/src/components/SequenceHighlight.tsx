import { highlightNucleicText } from "../lib/nucleotides";
import "./SequenceHighlight.css";

type SequenceHighlightProps = {
  text: string;
  emptyLabel?: string;
};

export default function SequenceHighlight({ text, emptyLabel }: SequenceHighlightProps) {
  const segments = highlightNucleicText(text);

  if (!text.trim()) {
    return <p className="seq-empty">{emptyLabel ?? "Paste a sequence to highlight start and stop codons."}</p>;
  }

  return (
    <pre className="seq-highlight mono">
      {segments.map((segment, index) => (
        <span key={`${index}-${segment.role}`} className={`seq-${segment.role}`}>
          {segment.text}
        </span>
      ))}
    </pre>
  );
}
