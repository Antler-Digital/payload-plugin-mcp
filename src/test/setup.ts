import { vi } from 'vitest'

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  error: vi.fn(),
  log: vi.fn(),
  warn: vi.fn(),
}

// Mock dynamic imports for richtext module
vi.mock('@payloadcms/richtext-lexical', () => ({
  convertLexicalToMarkdown: vi.fn(),
  convertMarkdownToLexical: vi.fn(),
  editorConfigFactory: vi.fn(),
}))

// Mock payload config import
vi.mock('@payload-config', () => ({
  default: {},
}))
