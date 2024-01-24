module.exports = {
  setupFiles: ["<rootDir>/test/setup-env.ts"],
  moduleFileExtensions: ["js", "json", "ts"],
  moduleNameMapper: {
    "src/(.*)$": "<rootDir>/src/$1",
    "@core/(.*)$": "<rootDir>/src/@core/$1",
    "@postgress-db/(.*)$": "<rootDir>/src/drizzle/$1",
  },
  rootDir: ".",
  testEnvironment: "node",
  testRegex: ".e2e-spec.ts$",
  transform: {
    "^.+\\.(t|j)s$": "ts-jest",
  },
};
