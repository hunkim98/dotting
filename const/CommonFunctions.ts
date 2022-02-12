import * as htmlToImage from "html-to-image";
import download from "downloadjs";

export const downloadImageRef = (ref: HTMLElement | null) => {
  if (ref !== null) {
    htmlToImage.toPng(ref).then(function (dataUrl) {
      download(dataUrl, "pixels");
    });
  }
};

export const range = (start: number, end: number) => {
  /* generate a range : [start, start+1, ..., end-1, end] */
  var len = end - start + 1;
  var a = new Array(len);
  for (let i = 0; i < len; i++) a[i] = start + i;
  return a;
};
