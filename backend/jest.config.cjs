module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: [
    '**/__tests__/**/*.test.js',
    '**/?(*.)+(spec|test).js'
  ],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/server.js',
    '!src/app.js',
    '!src/container.js',
    '!src/config/**/*.js',
    '!src/models/index.js',
    '!src/migrations/**',
    '!src/seeders/**',
  ],
  coverageThreshold: {
    global: {
      branches: 92,
      functions: 95,
      lines: 95,
      statements: 95,
    },
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  transformIgnorePatterns: ['/node_modules/(?!jose)'],
  testTimeout: 60000,
  verbose: true,
  detectOpenHandles: true,
  forceExit: true,
};
