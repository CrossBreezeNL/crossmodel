/** @type {import('eslint').Linter.Config} */
module.exports = {
    root: true,
    extends: [
        './configs/base.eslintrc.js',
        './configs/warnings.eslintrc.js',
        './configs/errors.eslintrc.js'
    ],
    ignorePatterns: ['**/{node_modules,lib}', '**/.eslintrc.js'],
    parserOptions: {
        tsconfigRootDir: __dirname,
        project: 'tsconfig.eslint.json'
    }
};
