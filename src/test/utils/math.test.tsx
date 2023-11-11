import { getBressenhamIndices } from "../../utils/math";

describe("test for math utils", () => {
  it("test bresseham line algorithm", () => {
    const testcases = [
      { x1: 0, y1: 0, x2: 5, y2: 10 }, // 1 < m < inf
      { x1: 0, y1: 0, x2: 10, y2: 5 }, // 0 < m < 1
      { x1: 0, y1: 0, x2: 10, y2: -5 }, // -1 < m < 0
      { x1: 0, y1: 0, x2: 5, y2: -10 }, // -inf < m < -1

      { x1: 0, y1: 0, x2: -5, y2: -10 }, // 1 < m < inf
      { x1: 0, y1: 0, x2: -10, y2: -5 }, // 0 < m < 1
      { x1: 0, y1: 0, x2: -10, y2: 5 }, // -1 < m < 0
      { x1: 0, y1: 0, x2: -5, y2: 10 }, // -inf < m < -1

      { x1: 0, y1: 0, x2: 5, y2: 0 }, // m = +0
      { x1: 0, y1: 0, x2: -5, y2: 0 }, // m = -0
      { x1: 0, y1: 0, x2: 0, y2: 5 }, // m = inf
      { x1: 0, y1: 0, x2: 0, y2: -5 }, // m = -inf

      { x1: 0, y1: 0, x2: 5, y2: 5 }, // m = +1
      { x1: 0, y1: 0, x2: 5, y2: -5 }, // m = -1
      { x1: 0, y1: 0, x2: -5, y2: -5 }, // m = +1
      { x1: 0, y1: 0, x2: -5, y2: 5 }, // m = -1
    ];

    const answers = [
      [
        //1<m<inf
        { rowIndex: 0, columnIndex: 0 },
        { rowIndex: 1, columnIndex: 1 },
        { rowIndex: 1, columnIndex: 2 },
        { rowIndex: 2, columnIndex: 3 },
        { rowIndex: 2, columnIndex: 4 },
        { rowIndex: 3, columnIndex: 5 },
        { rowIndex: 3, columnIndex: 6 },
        { rowIndex: 4, columnIndex: 7 },
        { rowIndex: 4, columnIndex: 8 },
        { rowIndex: 5, columnIndex: 9 },
      ],
      [
        //0<m<1
        { rowIndex: 0, columnIndex: 0 },
        { rowIndex: 1, columnIndex: 1 },
        { rowIndex: 2, columnIndex: 1 },
        { rowIndex: 3, columnIndex: 2 },
        { rowIndex: 4, columnIndex: 2 },
        { rowIndex: 5, columnIndex: 3 },
        { rowIndex: 6, columnIndex: 3 },
        { rowIndex: 7, columnIndex: 4 },
        { rowIndex: 8, columnIndex: 4 },
        { rowIndex: 9, columnIndex: 5 },
      ],
      [
        //-1<m<0
        { rowIndex: 0, columnIndex: 0 },
        { rowIndex: 1, columnIndex: -1 },
        { rowIndex: 2, columnIndex: -1 },
        { rowIndex: 3, columnIndex: -2 },
        { rowIndex: 4, columnIndex: -2 },
        { rowIndex: 5, columnIndex: -3 },
        { rowIndex: 6, columnIndex: -3 },
        { rowIndex: 7, columnIndex: -4 },
        { rowIndex: 8, columnIndex: -4 },
        { rowIndex: 9, columnIndex: -5 },
      ],
      [
        //-inf<m<-1
        { rowIndex: 0, columnIndex: 0 },
        { rowIndex: 1, columnIndex: -1 },
        { rowIndex: 1, columnIndex: -2 },
        { rowIndex: 2, columnIndex: -3 },
        { rowIndex: 2, columnIndex: -4 },
        { rowIndex: 3, columnIndex: -5 },
        { rowIndex: 3, columnIndex: -6 },
        { rowIndex: 4, columnIndex: -7 },
        { rowIndex: 4, columnIndex: -8 },
        { rowIndex: 5, columnIndex: -9 },
      ],

      [
        //1<m<inf
        { rowIndex: 0, columnIndex: 0 },
        { rowIndex: -1, columnIndex: -1 },
        { rowIndex: -1, columnIndex: -2 },
        { rowIndex: -2, columnIndex: -3 },
        { rowIndex: -2, columnIndex: -4 },
        { rowIndex: -3, columnIndex: -5 },
        { rowIndex: -3, columnIndex: -6 },
        { rowIndex: -4, columnIndex: -7 },
        { rowIndex: -4, columnIndex: -8 },
        { rowIndex: -5, columnIndex: -9 },
      ],
      [
        //0<m<1
        { rowIndex: 0, columnIndex: 0 },
        { rowIndex: -1, columnIndex: -1 },
        { rowIndex: -2, columnIndex: -1 },
        { rowIndex: -3, columnIndex: -2 },
        { rowIndex: -4, columnIndex: -2 },
        { rowIndex: -5, columnIndex: -3 },
        { rowIndex: -6, columnIndex: -3 },
        { rowIndex: -7, columnIndex: -4 },
        { rowIndex: -8, columnIndex: -4 },
        { rowIndex: -9, columnIndex: -5 },
      ],
      [
        //-1<m<0
        { rowIndex: 0, columnIndex: 0 },
        { rowIndex: -1, columnIndex: 1 },
        { rowIndex: -2, columnIndex: 1 },
        { rowIndex: -3, columnIndex: 2 },
        { rowIndex: -4, columnIndex: 2 },
        { rowIndex: -5, columnIndex: 3 },
        { rowIndex: -6, columnIndex: 3 },
        { rowIndex: -7, columnIndex: 4 },
        { rowIndex: -8, columnIndex: 4 },
        { rowIndex: -9, columnIndex: 5 },
      ],
      [
        //-inf<m<-1
        { rowIndex: 0, columnIndex: 0 },
        { rowIndex: -1, columnIndex: 1 },
        { rowIndex: -1, columnIndex: 2 },
        { rowIndex: -2, columnIndex: 3 },
        { rowIndex: -2, columnIndex: 4 },
        { rowIndex: -3, columnIndex: 5 },
        { rowIndex: -3, columnIndex: 6 },
        { rowIndex: -4, columnIndex: 7 },
        { rowIndex: -4, columnIndex: 8 },
        { rowIndex: -5, columnIndex: 9 },
      ],

      [
        //m = +0
        { rowIndex: 0, columnIndex: 0 },
        { rowIndex: 1, columnIndex: 0 },
        { rowIndex: 2, columnIndex: 0 },
        { rowIndex: 3, columnIndex: 0 },
        { rowIndex: 4, columnIndex: 0 },
      ],
      [
        //m = -0
        { rowIndex: 0, columnIndex: 0 },
        { rowIndex: -1, columnIndex: 0 },
        { rowIndex: -2, columnIndex: 0 },
        { rowIndex: -3, columnIndex: 0 },
        { rowIndex: -4, columnIndex: 0 },
      ],
      [
        //m = inf
        { rowIndex: 0, columnIndex: 0 },
        { rowIndex: 0, columnIndex: 1 },
        { rowIndex: 0, columnIndex: 2 },
        { rowIndex: 0, columnIndex: 3 },
        { rowIndex: 0, columnIndex: 4 },
      ],
      [
        //m = -inf
        { rowIndex: 0, columnIndex: 0 },
        { rowIndex: 0, columnIndex: -1 },
        { rowIndex: 0, columnIndex: -2 },
        { rowIndex: 0, columnIndex: -3 },
        { rowIndex: 0, columnIndex: -4 },
      ],

      [
        //m = +1
        { rowIndex: 0, columnIndex: 0 },
        { rowIndex: 1, columnIndex: 1 },
        { rowIndex: 2, columnIndex: 2 },
        { rowIndex: 3, columnIndex: 3 },
        { rowIndex: 4, columnIndex: 4 },
      ],
      [
        //m = -1
        { rowIndex: 0, columnIndex: 0 },
        { rowIndex: 1, columnIndex: -1 },
        { rowIndex: 2, columnIndex: -2 },
        { rowIndex: 3, columnIndex: -3 },
        { rowIndex: 4, columnIndex: -4 },
      ],
      [
        //m = +1
        { rowIndex: 0, columnIndex: 0 },
        { rowIndex: -1, columnIndex: -1 },
        { rowIndex: -2, columnIndex: -2 },
        { rowIndex: -3, columnIndex: -3 },
        { rowIndex: -4, columnIndex: -4 },
      ],
      [
        //m = -1
        { rowIndex: 0, columnIndex: 0 },
        { rowIndex: -1, columnIndex: 1 },
        { rowIndex: -2, columnIndex: 2 },
        { rowIndex: -3, columnIndex: 3 },
        { rowIndex: -4, columnIndex: 4 },
      ],
    ];

    for (let i = 0; i < answers.length; i++) {
      const { x1, y1, x2, y2 } = testcases[i];
      expect(getBressenhamIndices(x1, y1, x2, y2)).toStrictEqual(answers[i]);
    }
  });
});
