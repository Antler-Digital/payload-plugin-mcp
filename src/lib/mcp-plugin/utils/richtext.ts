import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'

/* eslint-disable @typescript-eslint/no-explicit-any */
import type { SanitizedConfig } from 'payload'

import type { CollectionAnalysis } from '../types/index.js'

let cachedEditorConfig: any | null = null
let cachedRichTextModule: any | null = null

async function getRichTextModule() {
  if (cachedRichTextModule) {return cachedRichTextModule}
  cachedRichTextModule = await import('@payloadcms/richtext-lexical')
  return cachedRichTextModule
}

async function getEditorConfig({
  payloadConfig,
}: {
  payloadConfig: SanitizedConfig
}): Promise<any> {
  if (cachedEditorConfig) {return cachedEditorConfig}
  const richtext = await getRichTextModule()
  const factory = (richtext).editorConfigFactory
  if (!factory) {throw new Error('editorConfigFactory not found in @payloadcms/richtext-lexical')}

  const editorConfigFactory = typeof factory?.default === 'function' ? factory.default : factory
  cachedEditorConfig = editorConfigFactory({ config: await payloadConfig })
  return cachedEditorConfig
}

export async function markdownToLexical(
  markdown: string,
  payloadConfig: SanitizedConfig,
): Promise<SerializedEditorState> {
  const richtext = await getRichTextModule()
  const editorConfig = await getEditorConfig({ payloadConfig })
  const convert = (richtext).convertMarkdownToLexical
  if (typeof convert !== 'function') {
    throw new Error('convertMarkdownToLexical function not found in @payloadcms/richtext-lexical')
  }
  return await convert({ editorConfig, markdown })
}

/**
 * Best-effort normalization to preserve content when markdown conversion hits unsupported nodes
 * (e.g., experimental tables). Converts table nodes into GitHub-Flavored Markdown (GFM)
 * so the rest of the document continues to convert.
 */
export function normalizeTablesForMarkdown(state: SerializedEditorState): SerializedEditorState {
  try {
    const clone: SerializedEditorState = JSON.parse(JSON.stringify(state))

    function extractPlainText(node: any): string {
      if (!node) {return ''}
      if (typeof (node as any).text === 'string') {return (node as any).text}
      const children = Array.isArray((node as any).children) ? (node as any).children : []
      return children.map(extractPlainText).join('')
    }

    function tableNodeToMarkdown(node: any): string {
      const rows = Array.isArray((node as any).children) ? (node as any).children : []
      const cellsByRow: string[][] = rows.map((row: any) => {
        const cells = Array.isArray((row as any).children) ? (row as any).children : []
        return cells.map((cell: any) => {
          const txt = extractPlainText(cell)
          return String(txt).replace(/\|/g, '\\|').trim()
        })
      })

      if (cellsByRow.length === 0) {return ''}
      const colCount = Math.max(...cellsByRow.map((r) => r.length)) || 1
      const header = (cellsByRow[0] || []).concat(Array(colCount).fill('')).slice(0, colCount)
      const separator = new Array(colCount).fill('---')
      const body = cellsByRow
        .slice(1)
        .map((r) => r.concat(Array(colCount).fill('')).slice(0, colCount))

      const toLine = (cols: string[]) => `| ${cols.join(' | ')} |`
      const lines = [toLine(header), toLine(separator), ...body.map(toLine)]
      return lines.join('\n')
    }

    function transform(node: any): any {
      if (!node || typeof node !== 'object') {return node}
      if ((node as any).type === 'table') {
        const md = tableNodeToMarkdown(node)
        return {
          type: 'paragraph',
          version: 1,
          children: [
            {
              type: 'text',
              version: 1,
              text: md,
            },
          ],
        }
      }
      if (Array.isArray((node as any).children)) {
        ;(node as any).children = (node as any).children.map(transform)
      }
      return node
    }

    if ((clone as any) && (clone as any).root) {
      ;(clone as any).root = transform((clone as any).root)
    }
    return clone
  } catch {
    return state
  }
}

export async function lexicalToMarkdown(
  data: SerializedEditorState,
  payloadConfig: SanitizedConfig,
): Promise<string> {
  const richtext = await getRichTextModule()
  const editorConfig = await getEditorConfig({ payloadConfig })
  const convert = (richtext).convertLexicalToMarkdown
  if (typeof convert !== 'function') {
    throw new Error('convertLexicalToMarkdown function not found in @payloadcms/richtext-lexical')
  }
  // Normalize unsupported nodes (e.g., tables) before converting to markdown
  const normalized = normalizeTablesForMarkdown(data)
  const out = await convert({ data: normalized, editorConfig }) as any
  // Some versions may return an array; ensure a string is returned from this util
  if (typeof out === 'string') {return out}
  if (Array.isArray(out)) {return out.join('\n')}
  return String(out ?? '')
}

function getValueAtPath(obj: any, path: string): any {
  const parts = path.split('.')
  let current = obj
  for (const part of parts) {
    if (current == null || typeof current !== 'object') {return undefined}
    current = current[part]
  }
  return current
}

function setValueAtPath(obj: any, path: string, value: any): void {
  const parts = path.split('.')
  let current = obj
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i]
    if (current[part] == null || typeof current[part] !== 'object') {
      current[part] = {}
    }
    current = current[part]
  }
  current[parts[parts.length - 1]] = value
}

function isLexicalEditorState(val: unknown): val is SerializedEditorState {
  return Boolean(val && typeof val === 'object' && (val as any).root)
}

export async function convertMarkdownFieldsToLexicalForData(
  data: Record<string, unknown>,
  analysis: CollectionAnalysis,
  payloadConfig: SanitizedConfig,
): Promise<Record<string, unknown>> {
  if (!data || typeof data !== 'object') {return data}

  const richTextFields = analysis.fields.filter((f) => f.type === 'richText')
  if (richTextFields.length === 0) {return data}

  const updated: Record<string, unknown> = { ...(data as any) }

  for (const field of richTextFields) {
    const current = getValueAtPath(updated, field.name)
    if (typeof current === 'string') {
      const converted = await markdownToLexical(current, payloadConfig)
      setValueAtPath(updated, field.name, converted)
    } else if (current == null) {
      // allow undefined/null to pass through
    } else if (isLexicalEditorState(current)) {
      throw new Error(
        `Invalid MCP input for richText field "${field.name}": expected Markdown string, received Lexical JSON. Provide Markdown only.`,
      )
    } else if (typeof current === 'object') {
      throw new Error(
        `Invalid MCP input for richText field "${field.name}": expected Markdown string, received object. Provide Markdown only.`,
      )
    } else {
      throw new Error(
        `Invalid MCP input for richText field "${field.name}": expected Markdown string.`,
      )
    }
  }

  return updated
}

export async function attachMarkdownFromLexicalInResult(
  result: any,
  analysis: CollectionAnalysis,
  payloadConfig: SanitizedConfig,
  options?: { truncateInList?: number },
  isListOperation: boolean = false,
): Promise<any> {
  const richTextFields = analysis.fields.filter((f) => f.type === 'richText')
  if (richTextFields.length === 0 && (result == null || typeof result !== 'object')) {return result}

  const truncateInList = options?.truncateInList ?? 0

  async function replaceOnDoc(doc: any) {
    if (!doc || typeof doc !== 'object') {return doc}

    // Targeted conversion for known richText fields on this collection
    for (const field of richTextFields) {
      const val = getValueAtPath(doc, field.name)
      if (isLexicalEditorState(val)) {
        try {
          const md = await lexicalToMarkdown(val, payloadConfig)
          // Apply truncation only if enabled AND we're in a list context
          if (truncateInList > 0 && isListOperation && md.length > truncateInList) {
            const truncated = md.substring(0, truncateInList)
            // Add ellipsis if we truncated
            const finalMd = truncated.length === truncateInList ? `${truncated}...` : truncated
            setValueAtPath(doc, field.name, finalMd)
          } else {
            setValueAtPath(doc, field.name, md)
          }
        } catch {
          setValueAtPath(doc, field.name, '')
        }
      }
    }

    // Deep conversion to catch richText inside populated relationships or nested objects
    async function deepConvert(value: any): Promise<any> {
      if (Array.isArray(value)) {
        return Promise.all(value.map((v) => deepConvert(v)))
      }
      if (isLexicalEditorState(value)) {
        try {
          const md = await lexicalToMarkdown(value, payloadConfig)
          // Apply truncation only if enabled AND we're in a list context
          if (truncateInList > 0 && isListOperation && md.length > truncateInList) {
            const truncated = md.substring(0, truncateInList)
            return truncated.length === truncateInList ? `${truncated}...` : truncated
          }
          return md
        } catch {
          return ''
        }
      }
      if (value && typeof value === 'object') {
        const entries = Object.entries(value)
        const convertedEntries = await Promise.all(
          entries.map(async ([k, v]) => [k, await deepConvert(v)] as const),
        )
        return Object.fromEntries(convertedEntries)
      }
      return value
    }

    return await deepConvert(doc)
  }
  if (result && Array.isArray(result.docs)) {
    result.docs = await Promise.all(result.docs.map((d: any) => replaceOnDoc(d)))
    return result
  }

  const replaced = await replaceOnDoc(result)

  return replaced
}
