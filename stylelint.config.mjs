/** @type {import('stylelint').Config} */
export default {
  extends: ["stylelint-config-recommended", "stylelint-config-tailwindcss"],
  ignoreFiles: ["**/node_modules/**", "**/.next/**", "**/dist/**"],
  rules: {
    // Tailwind utility classes in selectors use escapes (e.g. .bg-amber-500\/15).
    "selector-class-pattern": null,
  },
};
