module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'prettier'],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended', 'prettier'],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  env: {
    node: true,
    es6: true,
    jest: true,
  },
  rules: {
    // TypeScript specific rules - more lenient for development
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-non-null-assertion': 'warn',
    '@typescript-eslint/no-var-requires': 'error',

    // General ESLint rules - more lenient for development
    'no-console': 'off', // Allow console.log for debugging
    'no-debugger': 'error',
    'no-duplicate-imports': 'warn',
    'no-unused-expressions': 'warn',
    'prefer-const': 'warn',
    'no-var': 'error',
    'no-prototype-builtins': 'warn',

    // Prettier integration
    'prettier/prettier': 'error',
  },
  ignorePatterns: [
    'node_modules/',
    'dist/',
    'build/',
    'target/',
    'coverage/',
    '*.js',
    '!jest.config.js',
    '!.eslintrc.js',
  ],
};
