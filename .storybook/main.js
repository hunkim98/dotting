const path = require("path");

module.exports = {
  stories: [
    "../stories/**/*.stories.@(js|tsx|mdx|jsx)",
    "../stories/**/*.stories.mdx)",
  ],
  // Add any Storybook addons you want here: https://storybook.js.org/addons/
  framework: "@storybook/react",
  staticDirs: ["../public"],
  addons: ["@storybook/addon-essentials", "@storybook/addon-postcss"],
  core: {
    builder: "@storybook/builder-webpack5",
  },

  features: {
    interactionsDebugger: true,
    previewMdx2: true,
  },
  typescript: {
    // check: true,
    reactDocgen: "react-docgen-typescript",
    reactDocgenTypescriptOptions: {
      compilerOptions: {
        allowSyntheticDefaultImports: false,
        esModuleInterop: false,
      },
    },
  },
  webpackFinal: async config => {
    config.module.rules.push({
      test: /\.(ts|tsx)$/,
      loader: require.resolve("babel-loader"),
      options: {
        presets: [["react-app", { flow: false, typescript: true }]],
      },
    });
    config.resolve.extensions.push(".ts", ".tsx");

    return config;
  },
};
