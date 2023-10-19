interface DataLayerEmitData {
  canvas: OffscreenCanvas;
  width: number;
  height: number;
}

self.onmessage = event => {
  const { canvas, width, height } = event.data;
  const context = canvas.getContext("2d");
  const imageData = context.getImageData(0, 0, width, height);
  const data = imageData.data;
};
