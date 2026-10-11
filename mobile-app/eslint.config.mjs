import expo from 'eslint-config-expo/flat.js';

export default [
  ...expo,
  {
    ignores: ['dist/*', 'node_modules/*', '.expo/*'],
    rules: {
      'react-hooks/set-state-in-effect': 'off',
      'react/no-unescaped-entities': 'off',
      '@typescript-eslint/no-unused-vars': 'warn',
    },
  },
];
