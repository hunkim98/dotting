export class DottingError extends Error {
  name = "DottingError";
  constructor(message) {
    super(message);
  }
}

export class DuplicateLayerIdError extends DottingError {
  name = "DuplicateLayerIdError";
  constructor(layerId) {
    super(
      `Duplicate layer id ${layerId}. Please make sure all layer ids are unique.`,
    );
  }
}

export class InvalidSquareDataError extends DottingError {
  name = "InvalidSquareDataError";
  constructor(layerId?: string) {
    const message = layerId ? ` for layer ${layerId}` : "";
    super(
      `Invalid square data${message}. Please make sure all data have the same row and column count.`,
    );
  }
}

export class InvalidDataDimensionsError extends DottingError {
  name = "InvalidDataDimensionsError";
  constructor(layerId?: string) {
    const message = layerId ? ` for layer ${layerId}` : "";
    super(
      `Invalid data dimensions${message}. Please make sure all data have the same dimensions.`,
    );
  }
}

export class InvalidDataIndicesError extends DottingError {
  name = "InvalidDataIndicesError";
  constructor(layerId?: string) {
    const message = layerId ? ` for layer ${layerId}` : "";
    super(
      `Invalid data indices${message}. Please make sure all data have the same topRowIndex and leftColumnIndex.`,
    );
  }
}

export class UnspecifiedLayerIdError extends DottingError {
  name = "UnspecifiedLayerIdError";
  constructor() {
    super(`Layer id has not been specified`);
  }
}

export class InvalidLayerIdError extends DottingError {
  name = "InvalidLayerIdError";
  constructor(layerId) {
    super(`Invalid layer id ${layerId}.`);
  }
}

export class LayerNotFoundError extends DottingError {
  name = "LayerNotFoundError";
  constructor(layerId) {
    super(`Layer ${layerId} not found.`);
  }
}
