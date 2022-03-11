import { SetStateAction } from "react";
import { Pixel2dPixel, Pixel2dRow, Position } from "../Panel";
import { Pixel } from "../Pixel";
import * as S from "./styles";

interface Props {
  addColumn: ({
    position,
    data,
  }: {
    position: Position.LEFT | Position.RIGHT;
    data: Pixel2dPixel[];
  }) => void;
  addRow: ({
    position,
    data,
  }: {
    position: Position.TOP | Position.BOTTOM;
    data: Pixel2dPixel[];
  }) => void;
  deleteColumn: ({
    position,
  }: {
    position: Position.LEFT | Position.RIGHT;
  }) => void;
  deleteRow: ({
    position,
  }: {
    position: Position.TOP | Position.BOTTOM;
  }) => void;
}

const SizeControl: React.FC<Props> = ({
  children,
  addRow,
  addColumn,
  deleteRow,
  deleteColumn,
}) => {
  return (
    <>
      <S.HeightControlContainer location="top">
        <button
          onClick={() => {
            addRow({ position: Position.TOP, data: [] });
          }}
        >
          +
        </button>
        <button
          onClick={() => {
            deleteRow({ position: Position.TOP });
          }}
        >
          -
        </button>
      </S.HeightControlContainer>

      <S.WidthControlContainer location="left">
        <button
          onClick={() => {
            addColumn({ position: Position.LEFT, data: [] });
          }}
        >
          +
        </button>
        <button
          onClick={() => {
            deleteColumn({ position: Position.LEFT });
          }}
        >
          -
        </button>
      </S.WidthControlContainer>
      {children}
      <S.WidthControlContainer location="right">
        <button
          onClick={() => {
            addColumn({ position: Position.RIGHT, data: [] });
          }}
        >
          +
        </button>
        <button
          onClick={() => {
            deleteColumn({ position: Position.RIGHT });
          }}
        >
          -
        </button>
      </S.WidthControlContainer>
      <S.HeightControlContainer location="bottom">
        <button
          onClick={() => {
            addRow({ position: Position.BOTTOM, data: [] });
          }}
        >
          +
        </button>
        <button
          onClick={() => {
            deleteRow({ position: Position.BOTTOM });
          }}
        >
          -
        </button>
      </S.HeightControlContainer>
    </>
  );
};

export default SizeControl;
