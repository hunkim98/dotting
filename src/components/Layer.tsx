// https://medium.com/nerd-for-tech/using-the-react-children-prop-to-create-reusable-layout-components-93667aedc881

import { DottingData } from "./Canvas/types";

interface LayerProps {
  order: number;
  data: DottingData;
}

const Layer = ({ order, data }: LayerProps) => {
  return null;
};

export default Layer;
