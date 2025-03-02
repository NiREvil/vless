import js from '@eslint/js';
import globals from 'globals';

export default [
  {
    ignores: [
      'dist/**',
      'build/**',
      'warp.json',
      'hiddify/**',
      '.github/**',
      'edge/waste/**',
      'node_modules/**',
      'DNS over HTTPS/**',
      'package-lock.json',
      'edge/all-in-one.js',
      'edge/LoadBalance.js',
      'real address generator/**',
      'boringtun-boringtun-cli-0.5.2/**',
    ],
  },
  js.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.browser,
      },
    },
    rules: {
      semi: ['error', 'always'],
      quotes: ['error', 'single'],
    },
  },
];
