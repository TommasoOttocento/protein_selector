import { parseFasta, formatFasta } from "./fasta";
import type { SequenceKind } from "./translate";

export type HighlightRole = "plain" | "header" | "start" | "stop";

export type HighlightSegment = {
  text: string;
  role: HighlightRole;
};

const START_CODONS = new Set(["ATG"]);
const STOP_CODONS = new Set(["TAA", "TAG", "TGA"]);

function isNucleotide(char: string): boolean {
  return "ACGTUacgtu".includes(char);
}

function codonKey(bases: string): string {
  return bases.toUpperCase().replaceAll("U", "T");
}

export function highlightNucleicText(text: string): HighlightSegment[] {
  if (!text) {
    return [];
  }

  const roles: Array<HighlightRole | null> = Array.from({ length: text.length }, () => null);
  const baseIndexes: number[] = [];
  let lineStart = true;
  let inHeader = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (char === "\n") {
      lineStart = true;
      inHeader = false;
      continue;
    }
    if (lineStart && char === ">") {
      inHeader = true;
    }
    lineStart = false;
    if (inHeader) {
      roles[i] = "header";
      continue;
    }
    if (isNucleotide(char)) {
      baseIndexes.push(i);
    }
  }

  for (let i = 0; i <= baseIndexes.length - 3; i += 1) {
    const indexes = [baseIndexes[i], baseIndexes[i + 1], baseIndexes[i + 2]];
    const codon = codonKey(indexes.map((index) => text[index]).join(""));
    const role: HighlightRole | null = START_CODONS.has(codon)
      ? "start"
      : STOP_CODONS.has(codon)
        ? "stop"
        : null;
    if (!role) {
      continue;
    }
    for (const index of indexes) {
      if (roles[index] !== "start") {
        roles[index] = role;
      }
    }
  }

  const segments: HighlightSegment[] = [];
  for (let i = 0; i < text.length; i += 1) {
    const role = roles[i] ?? "plain";
    const last = segments[segments.length - 1];
    if (last && last.role === role) {
      last.text += text[i];
    } else {
      segments.push({ text: text[i], role });
    }
  }
  return segments;
}

function complementBase(base: string, kind: SequenceKind): string {
  const upper = base.toUpperCase();
  const map =
    kind === "RNA"
      ? { A: "U", T: "A", U: "A", C: "G", G: "C" }
      : { A: "T", T: "A", U: "A", C: "G", G: "C" };
  const paired = map[upper as keyof typeof map];
  if (!paired) {
    return base;
  }
  return base === upper ? paired : paired.toLowerCase();
}

export function reverseComplement(sequence: string, kind: SequenceKind): string {
  return sequence
    .split("")
    .reverse()
    .map((base) => complementBase(base, kind))
    .join("");
}

export function reverseComplementText(text: string, kind: SequenceKind): string {
  const trimmed = text.trim();
  if (!trimmed) {
    return "";
  }

  const records = parseFasta(text);
  const isFasta = trimmed.startsWith(">");
  if (!isFasta && records.length === 1) {
    return reverseComplement(records[0].sequence, kind);
  }

  return records
    .map((record) =>
      formatFasta(`${record.header} reverse complement`, reverseComplement(record.sequence, kind)),
    )
    .join("");
}
