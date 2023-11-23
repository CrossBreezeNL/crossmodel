/** @type {import('eslint').Linter.Config} */
module.exports = {
    extends: ['../../.eslintrc.js'],
    ignorePatterns: ['language-server/generated/**', 'jest.config.cjs', 'jest.setup.js'],
    rules: {
        // turn import issues off as eslint cannot handle ES modules
        'import/no-unresolved': 'off'
    }
};
