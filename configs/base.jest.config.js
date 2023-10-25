/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testPathIgnorePatterns: ['./node_modules/'],
    reporters: ['default', ['jest-junit', { outputDirectory: 'unit-test-results', outputName: 'jest-report.xml' }]]
};
