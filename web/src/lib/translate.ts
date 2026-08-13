export type SequenceKind = "DNA" | "RNA";

const CODON_TABLE: Record<string, string> = {
  UUU: "F",
  UUC: "F",
  UUA: "L",
  UUG: "L",
  UCU: "S",
  UCC: "S",
  UCA: "S",
  UCG: "S",
  UAU: "Y",
  UAC: "Y",
  UAA: "*",
  UAG: "*",
  UGU: "C",
  UGC: "C",
  UGA: "*",
  UGG: "W",
  CUU: "L",
  CUC: "L",
  CUA: "L",
  CUG: "L",
  CCU: "P",
  CCC: "P",
  CCA: "P",
  CCG: "P",
  CAU: "H",
  CAC: "H",
  CAA: "Q",
  CAG: "Q",
  CGU: "R",
  CGC: "R",
  CGA: "R",
  CGG: "R",
  AUU: "I",
  AUC: "I",
  AUA: "I",
  AUG: "M",
  ACU: "T",
  ACC: "T",
  ACA: "T",
  ACG: "T",
  AAU: "N",
  AAC: "N",
  AAA: "K",
  AAG: "K",
  AGU: "S",
  AGC: "S",
  AGA: "R",
  AGG: "R",
  GUU: "V",
  GUC: "V",
  GUA: "V",
  GUG: "V",
  GCU: "A",
  GCC: "A",
  GCA: "A",
  GCG: "A",
  GAU: "D",
  GAC: "D",
  GAA: "E",
  GAG: "E",
  GGU: "G",
  GGC: "G",
  GGA: "G",
  GGG: "G",
};

const DNA_BASES = new Set(["A", "C", "G", "T"]);
const RNA_BASES = new Set(["A", "C", "G", "U"]);

export function normalizeSequence(sequence: string): string {
  return sequence.toUpperCase().replace(/\s+/g, "");
}

export function translate(
  sequence: string,
  kind: SequenceKind,
  stopAtStop = true,
): string {
  const normalized = normalizeSequence(sequence);
  const allowed = kind === "DNA" ? DNA_BASES : RNA_BASES;
  const invalid = [...new Set(normalized.split("").filter((base) => !allowed.has(base)))].sort();

  if (invalid.length > 0) {
    throw new Error(
      `Invalid ${kind} bases: ${invalid.join(", ")}. Allowed: ${[...allowed].sort().join("")}`,
    );
  }

  const rna = kind === "DNA" ? normalized.replaceAll("T", "U") : normalized;
  const leftover = rna.length % 3;
  const aminoAcids: string[] = [];

  for (let i = 0; i < rna.length - leftover; i += 3) {
    const codon = rna.slice(i, i + 3);
    const aminoAcid = CODON_TABLE[codon];
    if (!aminoAcid) {
      throw new Error(`Unknown codon: ${codon}`);
    }
    if (aminoAcid === "*" && stopAtStop) {
      break;
    }
    aminoAcids.push(aminoAcid);
  }

  return aminoAcids.join("");
}
