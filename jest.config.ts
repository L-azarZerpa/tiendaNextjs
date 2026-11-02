import type { Config } from "jest";

const config: Config = {
  projects: [
    // Tests de lógica del servidor (Node.js) — auth, recaptcha, middleware
    {
      displayName: "server",
      testEnvironment: "node",
      roots: ["<rootDir>/src"],
      moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/src/$1",
      },
      testMatch: ["<rootDir>/src/__tests__/*.test.ts"],
      transform: {
        "^.+\\.tsx?$": "ts-jest",
      },
    },
    // Tests de componentes y páginas React (jsdom)
    {
      displayName: "components",
      testEnvironment: "jsdom",
      roots: ["<rootDir>/src"],
      moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/src/$1",
      },
      testMatch: [
        "<rootDir>/src/__tests__/components/**/*.test.tsx",
        "<rootDir>/src/__tests__/pages/**/*.test.tsx",
      ],
      transform: {
        "^.+\\.tsx?$": "ts-jest",
      },
      setupFilesAfterEnv: ["<rootDir>/src/__tests__/setup.ts"],
    },
  ],
};

export default config;
