// jest.config.js
const nextJest = require('next/jest')();

const createJestConfig = nextJest({
  dir: './', // Path to your Next.js app
});

const customJestConfig = {
  // Add more setup options before each test is run
  // setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    // Handle module aliases (this corresponds to your tsconfig/jsconfig paths)
    '^@/(.*)$': '<rootDir>/$1',
  },
   // Optional: collect coverage
   // collectCoverage: true,
   // coverageDirectory: "coverage",
   // coverageProvider: "v8",
};

module.exports = createJestConfig(customJestConfig);