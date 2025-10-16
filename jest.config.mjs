export default {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testEnvironment: 'node',
  transform: {
    '^.+\\.(t|j)s$': ['ts-jest'],
  },
  collectCoverageFrom: ['src/**/*.(t|j)s', 'test/**/*.(t|j)s', '!test/e2e/**'],
  coverageDirectory: './coverage',
  coveragePathIgnorePatterns: ['/node_modules/', '/dist/'],
  moduleNameMapper: {
    '^@shared$': '<rootDir>/src/core/shared/index.ts',
    '^@shared/(.*)$': '<rootDir>/src/core/shared/$1',
    '^@core/(.*)$': '<rootDir>/src/core/$1',
    '^@definitions$': '<rootDir>/src/core/definitions/definitions.ts',
    '^@platform/(.*)$': '<rootDir>/src/modules/platform/$1',
    '^@tenant/(.*)$': '<rootDir>/src/modules/tenant/$1',
  },
  testMatch: ['<rootDir>/test/**/*.spec.ts', '<rootDir>/src/**/__tests__/*.spec.ts'],
};
