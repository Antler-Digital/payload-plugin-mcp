#!/usr/bin/env node

/**
 * Script to sync CHANGELOG.md to dev/app/(site)/docs/changelog/page.mdx
 * This script converts the semantic-release generated changelog to MDX format
 * for the documentation site.
 */

import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const projectRoot = join(__dirname, '..')

const CHANGELOG_PATH = join(projectRoot, 'CHANGELOG.md')
const DOCS_CHANGELOG_PATH = join(
  projectRoot,
  'dev',
  'app',
  '(site)',
  'docs',
  'changelog',
  'page.mdx',
)

/**
 * Convert CHANGELOG.md content to MDX format
 * @param {string} changelogContent - Raw changelog content
 * @returns {string} MDX formatted content
 */
function convertToMdx(changelogContent) {
  // Add MDX frontmatter and header
  const mdxContent = `# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

${changelogContent}`

  return mdxContent
}

/**
 * Check if files exist and are readable
 */
function validateFiles() {
  if (!existsSync(CHANGELOG_PATH)) {
    throw new Error(`CHANGELOG.md not found at ${CHANGELOG_PATH}`)
  }

  // Ensure the docs directory exists
  const docsDir = dirname(DOCS_CHANGELOG_PATH)
  if (!existsSync(docsDir)) {
    throw new Error(`Documentation directory not found at ${docsDir}`)
  }
}

/**
 * Main sync function
 */
async function syncChangelog() {
  try {
    console.log('🔄 Starting changelog sync...')

    // Validate files exist
    validateFiles()

    // Read the generated CHANGELOG.md
    const changelogContent = readFileSync(CHANGELOG_PATH, 'utf8')

    if (!changelogContent.trim()) {
      console.warn('⚠️  CHANGELOG.md is empty, skipping sync')
      return
    }

    // Convert to MDX format
    const mdxContent = convertToMdx(changelogContent)

    // Write to docs changelog page
    writeFileSync(DOCS_CHANGELOG_PATH, mdxContent, 'utf8')

    console.log('✅ Changelog synced successfully!')
    console.log(`📄 Updated: ${DOCS_CHANGELOG_PATH}`)

    // Show a preview of what was synced
    const lines = changelogContent.split('\n').slice(0, 5)
    console.log('📋 Preview of synced content:')
    lines.forEach((line) => console.log(`   ${line}`))
    if (changelogContent.split('\n').length > 5) {
      console.log('   ...')
    }
  } catch (error) {
    console.error('❌ Error syncing changelog:', error.message)
    process.exit(1)
  }
}

// Run the sync
syncChangelog()
