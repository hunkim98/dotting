import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from ".";
import { mouseClickOn, mouseClickOff } from "./mouseEvent";

export default function useMouseEvent() {
  const { isLeftClicked } = useSelector((state: RootState) => state.mouseEvent);
  const dispatch = useDispatch();

  const mouseDown = useCallback(() => {
    dispatch(mouseClickOn());
  }, []);

  const mouseUp = useCallback(() => {
    dispatch(mouseClickOff());
  }, []);

  return { isLeftClicked, mouseDown, mouseUp };
}
