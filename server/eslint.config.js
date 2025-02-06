import prettier from 'eslint-config-prettier';
import ts from 'typescript-eslint';

export default ts.config(
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['dist/**', 'node_modules/**'],
    languageOptions: {
      parser: ts.parser,
      ecmaVersion: 'latest',
      sourceType: 'module'
    },
    rules: {
      ...prettier.rules
    }
  },
  prettier
);
