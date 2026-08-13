from translator.codon_table import CODON_TABLE, DNA_BASES, RNA_BASES


def normalize_sequence(sequence: str) -> str:
    return "".join(sequence.upper().split())


def to_rna(sequence: str, kind: str) -> str:
    if kind == "DNA":
        return sequence.replace("T", "U")
    return sequence


def validate(sequence: str, kind: str) -> None:
    allowed = DNA_BASES if kind == "DNA" else RNA_BASES
    invalid = sorted({base for base in sequence if base not in allowed})
    if invalid:
        raise ValueError(
            f"Invalid {kind} bases: {', '.join(invalid)}. "
            f"Allowed: {''.join(sorted(allowed))}"
        )


def translate(sequence: str, kind: str, stop_at_stop: bool = True) -> str:
    sequence = normalize_sequence(sequence)
    kind = kind.upper()
    if kind not in {"DNA", "RNA"}:
        raise ValueError("kind must be DNA or RNA")

    validate(sequence, kind)
    rna = to_rna(sequence, kind)

    amino_acids = []
    leftover = len(rna) % 3
    for i in range(0, len(rna) - leftover, 3):
        codon = rna[i : i + 3]
        amino_acid = CODON_TABLE[codon]
        if amino_acid == "*" and stop_at_stop:
            break
        amino_acids.append(amino_acid)

    return "".join(amino_acids)
