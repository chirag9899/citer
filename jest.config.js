module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testMatch: ['**/?(*.)+(test).[tj]s?(x)'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
}; 