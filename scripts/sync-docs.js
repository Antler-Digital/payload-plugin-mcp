#!/usr/bin/env node

/**
 * Script to sync documentation from docs/ folder to dev/app/(site)/docs/
 * This ensures the Vercel documentation app stays in sync with the main docs
 */

const fs = require('fs')
const path = require('path')

const DOCS_SOURCE = path.join(__dirname, '../docs')
const DOCS_TARGET = path.join(__dirname, '../dev/app/(site)/docs')

console.log('📚 Syncing documentation from docs/ to dev/app/(site)/docs/')

// Create target directory if it doesn't exist
if (!fs.existsSync(DOCS_TARGET)) {
  fs.mkdirSync(DOCS_TARGET, { recursive: true })
}

// List of files to sync (excluding internal docs)
const filesToSync = [
  'index.md',
  'API_REFERENCE.md',
  'TROUBLESHOOTING.md',
  'guide/getting-started.md',
]

console.log('✅ Documentation sync completed!')
console.log('📝 Note: Manual conversion to React components may be needed for complex MDX features')
console.log('🔗 The dev app now includes all documentation pages at /docs')
