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
  let previousName = undefined;
  if (pixel) {
    console.log(color);
    previousColor = pixel.style.backgroundColor;
    previousName = pixel.dataset.name;
    pixel.style.backgroundColor = color ? color : "";
    pixel.dataset.name = name;
  }
  return { previousColor, previousName };
};

export const decodePixelId = (elementId: string) => {
  const indexOfColumnString = elementId.indexOf("column");
  const rowIndex = Number(
    elementId.slice(0, indexOfColumnString).replace("row", "")
  );
  const columnIndex = Number(
    elementId.slice(indexOfColumnString, -1).replace("column", "")
  );
  return { rowIndex, columnIndex };
};
