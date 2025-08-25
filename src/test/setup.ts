import { vi } from 'vitest'

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  warn: vi.fn(),
  error: vi.fn(),
  log: vi.fn(),
}

// Mock dynamic imports for richtext module
vi.mock('@payloadcms/richtext-lexical', () => ({
  editorConfigFactory: vi.fn(),
  convertMarkdownToLexical: vi.fn(),
  convertLexicalToMarkdown: vi.fn(),
}))

// Mock payload config import
vi.mock('@payload-config', () => ({
  default: {},
}))
