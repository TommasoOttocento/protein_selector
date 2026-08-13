export type AtomCounts = {
  C: number;
  H: number;
  N: number;
  O: number;
  S?: number;
};

export type AminoAcidInfo = {
  name: string;
  color: string;
  formula: AtomCounts;
};

export const AMINO_ACIDS: Record<string, AminoAcidInfo> = {
  A: { name: "Alanine", color: "#8ecae6", formula: { C: 3, H: 7, N: 1, O: 2 } },
  R: { name: "Arginine", color: "#219ebc", formula: { C: 6, H: 14, N: 4, O: 2 } },
  N: { name: "Asparagine", color: "#90be6d", formula: { C: 4, H: 8, N: 2, O: 3 } },
  D: { name: "Aspartic acid", color: "#e63946", formula: { C: 4, H: 7, N: 1, O: 4 } },
  C: { name: "Cysteine", color: "#f4a261", formula: { C: 3, H: 7, N: 1, O: 2, S: 1 } },
  E: { name: "Glutamic acid", color: "#d62828", formula: { C: 5, H: 9, N: 1, O: 4 } },
  Q: { name: "Glutamine", color: "#43aa8b", formula: { C: 5, H: 10, N: 2, O: 3 } },
  G: { name: "Glycine", color: "#bdb2ff", formula: { C: 2, H: 5, N: 1, O: 2 } },
  H: { name: "Histidine", color: "#577590", formula: { C: 6, H: 9, N: 3, O: 2 } },
  I: { name: "Isoleucine", color: "#fcbf49", formula: { C: 6, H: 13, N: 1, O: 2 } },
  L: { name: "Leucine", color: "#f77f00", formula: { C: 6, H: 13, N: 1, O: 2 } },
  K: { name: "Lysine", color: "#3a86ff", formula: { C: 6, H: 14, N: 2, O: 2 } },
  M: { name: "Methionine", color: "#9b5de5", formula: { C: 5, H: 11, N: 1, O: 2, S: 1 } },
  F: { name: "Phenylalanine", color: "#ef476f", formula: { C: 9, H: 11, N: 1, O: 2 } },
  P: { name: "Proline", color: "#ffd166", formula: { C: 5, H: 9, N: 1, O: 2 } },
  S: { name: "Serine", color: "#06d6a0", formula: { C: 3, H: 7, N: 1, O: 3 } },
  T: { name: "Threonine", color: "#118ab2", formula: { C: 4, H: 9, N: 1, O: 3 } },
  W: { name: "Tryptophan", color: "#073b4c", formula: { C: 11, H: 12, N: 2, O: 2 } },
  Y: { name: "Tyrosine", color: "#fb5607", formula: { C: 9, H: 11, N: 1, O: 3 } },
  V: { name: "Valine", color: "#2a9d8f", formula: { C: 5, H: 11, N: 1, O: 2 } },
};

export function getAminoAcid(code: string): AminoAcidInfo {
  return (
    AMINO_ACIDS[code] ?? {
      name: code,
      color: "#9aa5a0",
      formula: { C: 0, H: 0, N: 0, O: 0 },
    }
  );
}

export function contrastText(hex: string): string {
  const value = hex.replace("#", "");
  const r = Number.parseInt(value.slice(0, 2), 16);
  const g = Number.parseInt(value.slice(2, 4), 16);
  const b = Number.parseInt(value.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55 ? "#1c2a24" : "#fffdf8";
}
