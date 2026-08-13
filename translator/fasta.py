def parse_fasta(text: str) -> list[tuple[str, str]]:
    """Parse FASTA text, or treat plain text as a single unnamed sequence."""
    records: list[tuple[str, str]] = []
    header: str | None = None
    chunks: list[str] = []

    for raw_line in text.splitlines():
        line = raw_line.strip()
        if not line:
            continue
        if line.startswith(">"):
            if header is not None or chunks:
                records.append((header or "sequence", "".join(chunks)))
            header = line[1:].strip() or "sequence"
            chunks = []
        else:
            chunks.append(line)

    if header is not None or chunks:
        records.append((header or "sequence", "".join(chunks)))

    return records
