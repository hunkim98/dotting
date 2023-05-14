import {
  StoriesComponentItem,
  StoriesComponentTableType,
  enumType,
} from "./types";

export function enumOptions(someEnum: enumType) {
  return {
    options: Object.keys(someEnum),
    mapping: someEnum,
    control: {
      type: "select",
      labels: Object.values(someEnum).filter(
        value => typeof value === "string",
      ),
    },
  };
}

export function generateComponentControl<T>({
  description,
  defaultValue,
  disable,
  table,
}: {
  description: string;
  disable: boolean;
  defaultValue?: T;
  table?: StoriesComponentTableType<T>;
}): StoriesComponentItem<T> {
  return {
    description,
    control: {
      disable,
    },
    defaultValue,
    table,
  };
}

export function generateComponentControlForEnum<T>({
  description,
  defaultValue,
  enumProp,
  disable,
}: {
  description: string;
  defaultValue: T;
  enumProp: { [s: number]: string };
  disable: boolean;
}): StoriesComponentItem<T> {
  return {
    description,
    mapping: enumProp,
    options: Object.keys(enumProp),
    control: {
      type: "select",
      labels: Object.values(enumProp),
      disable,
    },
    defaultValue,
  };
}
// {
//     return {
//         // description: "enum",
//         // mapping: enum,
//         // control: {
//         //     type: "select",
//         //     labels: Object.values(enum)
//         // },
//         // options: Object.keys(enum)
//     }
// }
