/* eslint-env node */

/** @type {import("eslint").Linter.Config} */
module.exports = {
  root: true,
  extends: ["next/core-web-vitals", "next/typescript"],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
  },
  rules: {
    // Enforce `import type` for type-only imports — keeps runtime bundle clean
    // and makes the distinction between types and values visible at every import.
    "@typescript-eslint/consistent-type-imports": [
      "error",
      {
        prefer: "type-imports",
        fixStyle: "separate-type-imports",
        disallowTypeAnnotations: false,
      },
    ],

    // Spec rule: never use raw hex colors anywhere outside app/globals.css and
    // tailwind.config.ts. Catches `bg-[#ff0000]`, `style={{ color: "#abc" }}`,
    // `const X = "#fff"`, etc.
    "no-restricted-syntax": [
      "error",
      {
        selector:
          "Literal[value=/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/]",
        message:
          "Raw hex color literals are forbidden. Use design tokens (bg-primary, text-foreground, etc.) declared in app/globals.css.",
      },
      {
        selector:
          "TemplateElement[value.raw=/^#[0-9a-fA-F]{3,8}$/]",
        message:
          "Raw hex color literals are forbidden. Use design tokens declared in app/globals.css.",
      },
      {
        selector:
          "TemplateElement[value.cooked=/^#[0-9a-fA-F]{3,8}$/]",
        message:
          "Raw hex color literals are forbidden. Use design tokens declared in app/globals.css.",
      },
    ],

    // Spec rule: features/* can only import from the foundation layers.
    // Cross-feature imports are denied. This is a default-on rule with no
    // patterns; the actual restrictions live in the features/ override below.
    "no-restricted-imports": ["error", { patterns: [] }],
  },
  overrides: [
    // Hex tokens are allowed in the design system files only.
    {
      files: ["app/globals.css", "tailwind.config.ts"],
      rules: { "no-restricted-syntax": "off" },
    },
    // Spec rule, scoped to features: only import from foundation layers,
    // and never from sibling features. Activates when code lands in features/.
    {
      files: ["features/**/*.{ts,tsx}"],
      rules: {
        "no-restricted-imports": [
          "error",
          {
            patterns: [
              {
                group: ["@/features/*", "../../features/*", "../features/*"],
                message:
                  "Cross-feature imports are forbidden. Move shared code into @/components/composite, @/lib, or @/types.",
              },
            ],
          },
        ],
      },
    },
    // scripts/ files are utility code; don't constrain imports there.
    {
      files: ["scripts/**/*"],
      rules: { "@typescript-eslint/no-unused-vars": "off" },
    },
  ],
};
