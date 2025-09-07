export default [
  {
    name: 'Main bundle (ESM)',
    path: 'dist/exports/index.js',
    limit: '100 KB',
    gzip: true,
  },
  {
    name: 'Types',
    path: 'dist/exports/index.d.ts',
    limit: '50 KB',
  },
]