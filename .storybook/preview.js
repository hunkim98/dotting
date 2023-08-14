// import "../src/index.css";

//👇 Configures Storybook to log the actions( onArchiveTask and onPinTask ) in the UI.
export const parameters = {
  actions: { argTypesRegex: "^on[A-Z].*" },
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
  options: {
    storySort: {
      // Introduction will be shown first
      order: ["Introduction", "Customization", "Components", "Hooks", "Hooks/Setup"],
    },
  },
};
