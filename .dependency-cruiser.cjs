/**
 * Sensor estrutural: pega ciclos, órfãos e dependências proibidas que o ESLint
 * não vê (ex.: ciclos que atravessam vários arquivos).
 */
module.exports = {
  forbidden: [
    {
      name: 'sem-ciclos',
      severity: 'error',
      comment:
        'Dependência circular detectada. Quebre o ciclo extraindo os tipos/constantes compartilhados para um módulo folha em src/shared/.',
      from: {},
      to: { circular: true },
    },
    {
      name: 'sem-orfaos',
      severity: 'warn',
      comment: 'Módulo não é importado por ninguém. Provavelmente código morto — remova ou conecte.',
      from: { orphan: true, pathNot: ['\\.d\\.ts$', '(^|/)app/', '\\.test\\.(ts|tsx)$', '^src/test/'] },
      to: {},
    },
    {
      name: 'shared-nao-importa-feature',
      severity: 'error',
      comment: 'src/shared/ é a camada base: não pode conhecer features nem rotas.',
      from: { path: '^src/shared/' },
      to: { path: '^(src/features/|app/)' },
    },
    {
      name: 'feature-nao-importa-rota',
      severity: 'error',
      comment: 'Features não podem importar arquivos de rota (app/). A dependência é o contrário.',
      from: { path: '^src/features/' },
      to: { path: '^app/' },
    },
    {
      name: 'sem-deps-nao-declaradas',
      severity: 'error',
      comment: 'Pacote usado mas não declarado no package.json.',
      from: {},
      to: { dependencyTypes: ['npm-no-pkg', 'npm-unknown'] },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    exclude: { path: '(node_modules|\\.expo|coverage|/(ios|android)/)' },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: 'tsconfig.json' },
    enhancedResolveOptions: {
      extensions: ['.ts', '.tsx', '.js', '.jsx', '.ios.ts', '.android.ts'],
    },
    reporterOptions: { text: { highlightFocused: true } },
  },
};
