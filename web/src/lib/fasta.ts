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

export function formatFasta(header: string, sequence: string, width = 70): string {
  const chunks: string[] = [];
  for (let i = 0; i < sequence.length; i += width) {
    chunks.push(sequence.slice(i, i + width));
  }
  const body = chunks.length > 0 ? `${chunks.join("\n")}\n` : "";
  return `>${header}\n${body}`;
}

export function downloadTextFile(filename: string, content: string): void {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

