export type FastaRecord = {
  header: string;
  sequence: string;
};

export function parseFasta(text: string): FastaRecord[] {
  const records: FastaRecord[] = [];
  let header: string | null = null;
  let chunks: string[] = [];

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) {
      continue;
    }
    if (line.startsWith(">")) {
      if (header !== null || chunks.length > 0) {
        records.push({
          header: header ?? "sequence",
          sequence: chunks.join(""),
        });
      }
      header = line.slice(1).trim() || "sequence";
      chunks = [];
    } else {
      chunks.push(line);
    }
  }

  if (header !== null || chunks.length > 0) {
    records.push({
      header: header ?? "sequence",
      sequence: chunks.join(""),
    });
  }

  return records;
}

