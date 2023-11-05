export const DataLayerWorkerString = `
self.onmessage = e => {
  const { canvas } = e.data;
  console.log("canvas", canvas);
};

self.addEventListener("message", e => {
  const message = e.data || e;
});
`;
