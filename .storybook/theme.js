// .storybook/YourTheme.js

import { create } from "@storybook/theming";
import logoUrl from "./dotting_brand.png";

export default create({
  base: "light",
  brandTitle: "dotting",
  brandUrl: "https://hunkim98.github.io/dotting",
  brandImage: logoUrl,
  brandTarget: "_self",
});
