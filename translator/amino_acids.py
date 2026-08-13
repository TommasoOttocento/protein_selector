AMINO_ACIDS: dict[str, dict[str, str]] = {
    "A": {"name": "Alanine", "color": "#8ecae6", "formula": "C3H7NO2"},
    "R": {"name": "Arginine", "color": "#219ebc", "formula": "C6H14N4O2"},
    "N": {"name": "Asparagine", "color": "#90be6d", "formula": "C4H8N2O3"},
    "D": {"name": "Aspartic acid", "color": "#e63946", "formula": "C4H7NO4"},
    "C": {"name": "Cysteine", "color": "#f4a261", "formula": "C3H7NO2S"},
    "E": {"name": "Glutamic acid", "color": "#d62828", "formula": "C5H9NO4"},
    "Q": {"name": "Glutamine", "color": "#43aa8b", "formula": "C5H10N2O3"},
    "G": {"name": "Glycine", "color": "#bdb2ff", "formula": "C2H5NO2"},
    "H": {"name": "Histidine", "color": "#577590", "formula": "C6H9N3O2"},
    "I": {"name": "Isoleucine", "color": "#fcbf49", "formula": "C6H13NO2"},
    "L": {"name": "Leucine", "color": "#f77f00", "formula": "C6H13NO2"},
    "K": {"name": "Lysine", "color": "#3a86ff", "formula": "C6H14N2O2"},
    "M": {"name": "Methionine", "color": "#9b5de5", "formula": "C5H11NO2S"},
    "F": {"name": "Phenylalanine", "color": "#ef476f", "formula": "C9H11NO2"},
    "P": {"name": "Proline", "color": "#ffd166", "formula": "C5H9NO2"},
    "S": {"name": "Serine", "color": "#06d6a0", "formula": "C3H7NO3"},
    "T": {"name": "Threonine", "color": "#118ab2", "formula": "C4H9NO3"},
    "W": {"name": "Tryptophan", "color": "#073b4c", "formula": "C11H12N2O2"},
    "Y": {"name": "Tyrosine", "color": "#fb5607", "formula": "C9H11NO3"},
    "V": {"name": "Valine", "color": "#2a9d8f", "formula": "C5H11NO2"},
}


def amino_acid_name(code: str) -> str:
    info = AMINO_ACIDS.get(code.upper())
    return info["name"] if info else code


def amino_acid_formula(code: str) -> str:
    info = AMINO_ACIDS.get(code.upper())
    return info["formula"] if info else ""
