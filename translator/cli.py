from pathlib import Path

from translator.amino_acids import amino_acid_formula, amino_acid_name
from translator.fasta import parse_fasta
from translator.translate import translate


def ask_kind() -> str:
    while True:
        choice = input("Sequence type [DNA/RNA]: ").strip().upper()
        if choice in {"DNA", "RNA"}:
            return choice
        print("Please type DNA or RNA.")


def main() -> None:
    kind = ask_kind()
    source = input(f"Enter {kind} sequence or FASTA file path: ").strip()
    path = Path(source)
    text = path.read_text(encoding="utf-8") if path.is_file() else source

    records = parse_fasta(text)
    if not records:
        raise ValueError("No sequence found")

    for header, sequence in records:
        protein = translate(sequence, kind)
        names = ", ".join(
            f"{amino_acid_name(code)} ({amino_acid_formula(code)})" for code in protein
        )
        print(f">{header}")
        print(f"Amino acids: {protein}")
        if protein:
            print(f"Names: {names}")
