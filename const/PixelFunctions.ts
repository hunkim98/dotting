interface Props {
  rowIndex: number;
  columnIndex: number;
  color: string | undefined;
  name: string | undefined;
}

export const modifyPixelById = ({
  rowIndex,
  columnIndex,
  color,
  name,
}: Props) => {
  const pixel = document.getElementById(`row${rowIndex}column${columnIndex}`);
  let previousColor = undefined;
  if (pixel) {
    previousColor = pixel.style.backgroundColor;
    pixel.style.backgroundColor = color ? color : "";
    pixel.dataset.name = name;
  }
  return { previousColor };
};
