export default [
  {
    name: 'Main bundle (ESM)',
    path: 'dist/exports/index.js',
    limit: '50 KB',
    gzip: true,
  },
  {
    name: 'Types',
    path: 'dist/exports/index.d.ts',
    limit: '10 KB',
  },
]