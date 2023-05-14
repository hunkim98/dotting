export type StoriesComponentItem<T> = {
  description: string;
  mapping?: { [s: number]: string };
  options?: string[];
  control: {
    type?: string;
    labels?: string[];
    disable: boolean;
  };
  defaultValue?: T;
  table?: StoriesComponentTableType<T>;
};

export type enumType = { [s: number]: string };

export type StoriesComponentTableType<T> = {
  defaultValue?: {
    summary: T;
  };
};

export type KeysEnum<T, K> = { [P in keyof Required<T>]: K };
