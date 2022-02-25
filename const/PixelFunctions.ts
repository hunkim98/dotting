export const modifyPixelById = (
  rowIndex: number,
  columnIndex: number,
  color: string,
  name: string
) => {
  const pixel = document.getElementById(`row${rowIndex}column${columnIndex}`);
  if (pixel) {
    pixel.style.backgroundColor = color;
  }
};
