/** @type {import('ts-jest').JestConfigWithTsJest} */
const baseConfig = require('./base.jest.config');

module.exports = {
   ...baseConfig,
   extensionsToTreatAsEsm: ['.ts', '.tsx'],
   moduleNameMapper: {
      '^(\\.{1,2}/.*)\\.js$': '$1'
   },
   transform: {
      // '^.+\\.[tj]sx?$' to process js/ts with `ts-jest`
      // '^.+\\.m?[tj]sx?$' to process js/ts/mjs/mts with `ts-jest`
      '^.+\\.tsx?$': [
         'ts-jest',
         {
            useESM: true
         }
      ]
   }
};
