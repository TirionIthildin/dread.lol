import coreWebVitals from "eslint-config-next/core-web-vitals";
import typescript from "eslint-config-next/typescript";

/** @type {import("eslint").Linter.Config[]} */
const config = [
  ...coreWebVitals,
  ...typescript,
  {
    name: "dread/react-hooks-pragmatic",
    rules: {
      // React Hooks plugin v7: valuable for greenfield code; many valid patterns in this app
      // still trigger these. Re-enable incrementally when refactoring.
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/refs": "off",
      "react-hooks/preserve-manual-memoization": "off",
      "react-hooks/static-components": "off",
      "react-hooks/error-boundaries": "off",
    },
  },
];

export default config;
