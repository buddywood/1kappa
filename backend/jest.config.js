module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/?(*.)+(spec|test).ts'],
  // Skip integration tests during CI/deployment
  testPathIgnorePatterns: process.env.SKIP_INTEGRATION_TESTS === 'true' 
    ? ['/node_modules/', '.*\\.integration\\.test\\.ts$', '.*integration.*\\.test\\.ts$']
    : ['/node_modules/'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/db/migrations/**',
    '!src/scripts/**',
    '!src/server.ts',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
};

