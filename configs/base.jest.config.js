/** @type {import('ts-jest').JestConfigWithTsJest} */
const path = require('path');

module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testPathIgnorePatterns: ['./node_modules/'],
    reporters: [
        [
            'jest-junit',
            {
                outputDirectory: path.join(__dirname, '..', 'unit-test-results'),
                outputName: 'jest-report',
                uniqueOutputName: 'true'
            }
        ],
        ['github-actions', { silent: false }],
        'summary'
    ]
};
