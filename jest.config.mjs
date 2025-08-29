export default {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testEnvironment: 'node',
  transform: {
    '^.+\\.(t|j)s$': ['ts-jest'],
  },
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: './coverage',
  coveragePathIgnorePatterns: ['/node_modules/'],
  moduleNameMapper: {
    '^@core/(.*)$': '<rootDir>/src/core/$1',
    '^@definitions$': '<rootDir>/src/core/definitions/definitions.ts',
    '^@modules/(.*)$': '<rootDir>/src/modules/$1',
    '^@platform/(.*)$': '<rootDir>/src/modules/platform/$1',
  },
  testMatch: ['<rootDir>/test/**/*.spec.ts', '<rootDir>/src/**/__tests__/*.spec.ts'],
};
