export default function range(start: number, end: number) {
  /* generate a range : [start, start+1, ..., end-1, end] */
  var len = end - start + 1;
  var a = new Array(len);
  for (let i = 0; i < len; i++) a[i] = start + i;
  return a;
}
