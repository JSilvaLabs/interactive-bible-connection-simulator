// jest.config.js (Attempt 4 - Simplified Mapper Focus)
const nextJest = require('next/jest')({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  // Let's keep this based on Next.js docs, even with the warning.
  dir: './',
});

// Add any custom config to be passed to Jest
const customJestConfig = {
  // Add more setup options before each test is run if needed
  // setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],

  testEnvironment: 'jest-environment-jsdom',

  // ONLY use moduleNameMapper for the alias resolution
  // Ensure <rootDir> points to your project root (where package.json is)
  moduleNameMapper: {
      // This maps '@/(anything)' to '<rootDir>/(anything)'
      '^@/(.*)$': '<rootDir>/$1',
  },

  // Removed modulePaths and moduleDirectories for simplicity
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = nextJest(customJestConfig); // Pass config directly to nextJest