// https://medium.com/nerd-for-tech/using-the-react-children-prop-to-create-reusable-layout-components-93667aedc881

import { DottingData } from "./Canvas/types";

interface LayerProps {
  order: number;
  data: DottingData;
}

/**
 * @description Layer is a component for configuration. It does not render anything.
 * @param param0
 * @returns
 */
const Layer = ({ order, data }: LayerProps) => {
  return null;
};

export default Layer;
