import { BaseLayer } from "./BaseLayer";
import { PixelModifyItem } from "./types";

export default class DataLayer extends BaseLayer {
  private swipedPixels: Array<PixelModifyItem> = [];

  constructor({ canvas }: { canvas: HTMLCanvasElement }) {
    super({ canvas });
  }

  /**
   * The name is setSwipedPixels since the data layer will not accept adding items to swiped pixels
   * @param pixel
   */
  setSwipedPixels(pixelItems: Array<PixelModifyItem>) {
    this.swipedPixels = pixelItems;
  }

  render() {
    return;
  }
}
