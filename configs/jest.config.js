module.exports = {
    rootDir: '../',
    projects: ['<rootDir>/applications/*', '<rootDir>/extensions/*', '<rootDir>/packages/*'],
    reporters: ['default', ['jest-junit', { outputDirectory: 'unit-test-results', outputName: 'jest-report.xml' }]]
};
