const path = require("path");

module.exports = {
  stories: ["../src/**/*.stories.@(js|tsx|mdx)"],
  // Add any Storybook addons you want here: https://storybook.js.org/addons/
  addons: [],
  //   core: {
  //     builder: "webpack5",
  //   },
  webpackFinal: async (config) => {
    config.module.rules.push({
      test: /\.scss$/,
      use: ["style-loader", "css-loader", "sass-loader"],
      include: path.resolve(__dirname, "../"),
    });

    config.module.rules.push({
      test: /\.(ts|tsx)$/,
      loader: require.resolve("babel-loader"),
      options: {
        presets: [["react-app", { flow: false, typescript: true }]],
      },
    });
    config.resolve.extensions.push(".ts", ".tsx");
    // config.resolve.plugins = [
    //   new TsconfigPathsPlugin({
    //     configFile: path.resolve(__dirname, "../tsconfig.json"),
    //   }),
    // ];

    return config;
  },
};
