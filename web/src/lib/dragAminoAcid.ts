let draggedAminoAcid: string | null = null;

export function setDraggedAminoAcid(code: string | null): void {
  draggedAminoAcid = code;
}

export function getDraggedAminoAcid(): string | null {
  return draggedAminoAcid;
}
