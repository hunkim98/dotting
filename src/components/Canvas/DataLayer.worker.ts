// this is just an example of how to use a web worker
// We will not use this for Dotting since Dotting has multiple canvases
// which makes it difficult to use a web worker
// Webworker works best when we have a single canvas to render all the data
export const DataLayerWorkerString = `

var canvasB = null;
var ctxWorker = null;
var dpr = 1;
var capturedImageBitmapScale = null;
var capturedImageBitmap = null;

self.onmessage = e => {
  if (e.data.canvas) {
    // update canvas (this should happen initially)
    canvasB = e.data.canvas;
    ctxWorker = canvasB.getContext("2d");
  }
  if(e.data.dpr) {
    dpr = e.data.dpr;
    ctxWorker.scale(dpr, dpr);
  }
  if(e.data.capturedImageBitmap !== undefined) {
    capturedImageBitmap = e.data.capturedImageBitmap;
  }
  if(ctxWorker && e.data.offset && e.data.width && e.data.height && e.data.capturedImageBitmap) {
    ctxWorker.clearRect(0, 0, canvasB.width, canvasB.height);
    ctxWorker.drawImage(
      e.data.capturedImageBitmap,
      e.data.offset.x,
      e.data.offset.y,
      e.data.width,
      e.data.height,
    );
  }
};
`;
