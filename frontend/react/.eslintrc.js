module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  env: {
    browser: true,
    es2021: true,
  },
  plugins: ['react', '@typescript-eslint', 'tailwindcss'],
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:tailwindcss/recommended',
  ],
  rules: {
    // customize these if needed:
    'react/react-in-jsx-scope': 'off', // not needed with modern React
    'tailwindcss/no-custom-classname': 'off', // disable if using custom class naming
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
};
