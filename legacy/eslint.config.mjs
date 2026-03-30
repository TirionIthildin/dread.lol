import coreWebVitals from "eslint-config-next/core-web-vitals";
import typescript from "eslint-config-next/typescript";

/** @type {import("eslint").Linter.Config[]} */
const config = [
  ...coreWebVitals,
  ...typescript,
  {
    name: "dread/next-image",
    rules: {
      "@next/next/no-img-element": "error",
    },
  },
  {
    name: "dread/react-hooks-pragmatic",
    rules: {
      // React Compiler rules: too noisy for common patterns (effects syncing state, nested UI components).
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/refs": "off",
      "react-hooks/preserve-manual-memoization": "off",
      "react-hooks/static-components": "off",
      "react-hooks/error-boundaries": "off",
    },
  },
];

export default config;
