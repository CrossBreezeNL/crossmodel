/** @type {import('eslint').Linter.Config} */
module.exports = {
    root: true,
    extends: ['./configs/base.eslintrc.js', './configs/warnings.eslintrc.js', './configs/errors.eslintrc.js'],
    ignorePatterns: [
        '**/{node_modules,lib}',
        '**/.eslintrc.js',
        'extensions/**/generated',
        '**/*jest.config.js',
        '**/*.eslintrc.js',
        '**/*.eslintrc.cjs',
        '**/language-server/generated/**'
    ],
    parserOptions: {
        tsconfigRootDir: __dirname,
        project: 'tsconfig.eslint.json'
    },
    parser: '@typescript-eslint/parser',
    plugins: ['@typescript-eslint'],
    settings: {
        react: {
            version: 'detect'
        }
    }
};
