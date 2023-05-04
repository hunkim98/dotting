export function generatePixelId(rowIndex: number, columnIndex: number): string {
  return `${rowIndex}*${columnIndex}`;
}

export function parsePixelId(pixelId: string): {
  rowIndex: number;
  columnIndex: number;
} {
  const [rowIndex, columnIndex] = pixelId.split("*");
  return {
    rowIndex: parseInt(rowIndex),
    columnIndex: parseInt(columnIndex),
  };
}
