// Sensor computacional principal do harness.
// Regras aqui devem falar com o agente: mensagens explicam O QUE fazer, não só o que está errado.
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const tseslint = require('typescript-eslint');
const boundaries = require('eslint-plugin-boundaries');
const prettier = require('eslint-config-prettier');

module.exports = defineConfig([
  ...expoConfig,
  ...tseslint.configs.recommendedTypeChecked,
  prettier,
  {
    ignores: ['dist/*', 'node_modules/*', 'ios/*', 'android/*', '.expo/*', 'coverage/*'],
  },
  {
    files: ['**/*.js', '**/*.cjs', '**/*.mjs'],
    ...tseslint.configs.disableTypeChecked,
    languageOptions: {
      ...tseslint.configs.disableTypeChecked.languageOptions,
      globals: {
        require: 'readonly',
        module: 'readonly',
        exports: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        process: 'readonly',
      },
    },
    rules: {
      ...tseslint.configs.disableTypeChecked.rules,
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: __dirname,
      },
    },
    plugins: { boundaries },
    settings: {
      'boundaries/include': ['app/**/*', 'src/**/*'],
      'boundaries/elements': [
        { type: 'route', pattern: 'app/**/*', mode: 'full' },
        { type: 'feature', pattern: 'src/features/*', capture: ['name'], mode: 'folder' },
        { type: 'shared', pattern: 'src/shared/*', capture: ['name'], mode: 'folder' },
        { type: 'test', pattern: 'src/test/*', mode: 'folder' },
      ],
    },
    rules: {
      // --- Fitness de arquitetura (feedback sensor) ---
      'boundaries/element-types': [
        'error',
        {
          default: 'disallow',
          message:
            'Violação de camada: {{file.type}} não pode importar {{dep.type}}. ' +
            'Regra: app/ -> features/ -> shared/. Features não conversam entre si; ' +
            'extraia o código comum para src/shared/ ou exponha via a API pública da feature. ' +
            'Veja docs/architecture.md.',
          rules: [
            { from: 'route', allow: ['feature', 'shared'] },
            { from: 'feature', allow: ['shared', ['feature', { name: '${from.name}' }]] },
            { from: 'shared', allow: ['shared'] },
            { from: 'test', allow: ['route', 'feature', 'shared'] },
          ],
        },
      ],

      // --- Encapsulamento de infraestrutura ---
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'react-native-mmkv',
              message:
                'Não use MMKV direto. Importe de "@/shared/storage/kv" para manter um único ponto de configuração e permitir mock nos testes.',
            },
            {
              name: 'expo-secure-store',
              message:
                'Não use SecureStore direto. Importe de "@/shared/storage/secure" (tokens e segredos passam por lá).',
            },
            {
              name: 'expo-sqlite',
              message: 'Acesse o banco por "@/shared/storage/db" — migrations e conexão vivem lá.',
            },
            {
              name: 'axios',
              message:
                'O projeto usa fetch encapsulado em "@/shared/api/http". Não adicione outro cliente HTTP.',
            },
          ],
          patterns: [
            {
              group: ['../../features/*'],
              message:
                'Import cruzado entre features é proibido. Suba o código para src/shared/ ou use a API pública da feature (index.ts).',
            },
          ],
        },
      ],

      // --- Qualidade / previsibilidade ---
      'no-console': ['error', { allow: ['warn', 'error'] }],
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unnecessary-condition': 'warn',
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
      eqeqeq: ['error', 'always'],
    },
  },
  {
    // Testes: podem cruzar camadas (precisam importar helpers de src/test/) e
    // relaxar tipagem. O que NÃO relaxa: as regras de contrato do código de produção.
    files: ['**/*.test.ts', '**/*.test.tsx', 'src/test/**/*'],
    rules: {
      'boundaries/element-types': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      'no-console': 'off',
    },
  },
]);
