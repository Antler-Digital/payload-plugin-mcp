/* eslint-disable @typescript-eslint/no-explicit-any */
import type { BasePayload, CollectionConfig, CollectionSlug, Field } from 'payload'

import type {
  CollectionAnalysis,
  CollectionMcpOptions,
  FieldAnalysis,
  JSONSchema7,
  ToolDescriptor,
  ToolOperation,
} from '../types/index.js'

import { getAuthContext } from '../auth-context.js'
import {
  attachMarkdownFromLexicalInResult,
  convertMarkdownFieldsToLexicalForData,
} from './richtext.js'

/**
 * Generate MCP tool descriptors from PayloadCMS collections with their MCP configurations
 */
export function generateToolDescriptors(
  collectionAnalyses: CollectionAnalysis[],
): ToolDescriptor[] {
  const descriptors: ToolDescriptor[] = []

  for (const analysis of collectionAnalyses) {
    if (
      analysis.slug.includes('migrations') ||
      analysis.slug.includes('preferences') ||
      analysis.slug.includes('locked')
    ) {
      continue
    }

    // Get the complete collection analysis (populate fields if needed)
    const completeAnalysis =
      analysis.fields.length > 0 ? analysis : completeCollectionAnalysis(analysis)
    const operations = completeAnalysis.mcpOptions?.operations || {
      create: false,
      delete: false,
      get: true,
      list: true,
      update: false,
    }

    const toolPrefix = completeAnalysis.mcpOptions?.toolPrefix || completeAnalysis.slug
    const collectionDescription =
      completeAnalysis.mcpOptions?.description || `${completeAnalysis.slug} collection`

    // Globals only support get/update
    if (completeAnalysis.isGlobal) {
      if (operations.get) {
        descriptors.push(createGetTool(completeAnalysis, String(toolPrefix), collectionDescription))
      }
      if (operations.update) {
        descriptors.push(
          createUpdateTool(completeAnalysis, String(toolPrefix), collectionDescription),
        )
      }
      continue
    }

    // Generate tools based on enabled operations
    if (operations.list) {
      descriptors.push(createListTool(completeAnalysis, toolPrefix, collectionDescription))
    }

    if (operations.get) {
      descriptors.push(createGetTool(completeAnalysis, toolPrefix, collectionDescription))
    }

    if (operations.create) {
      descriptors.push(createCreateTool(completeAnalysis, toolPrefix, collectionDescription))
    }

    if (operations.update) {
      descriptors.push(createUpdateTool(completeAnalysis, toolPrefix, collectionDescription))
    }

    if (operations.delete) {
      descriptors.push(createDeleteTool(completeAnalysis, toolPrefix, collectionDescription))
    }
  }

  return descriptors
}

/**
 * Complete collection analysis by populating fields if they're missing
 * This is a helper to handle cases where we only have basic info
 */
function completeCollectionAnalysis(analysis: CollectionAnalysis): CollectionAnalysis {
  // If we already have fields, return as-is
  if (analysis.fields.length > 0) {
    return analysis
  }

  // For now, return the analysis as-is since we don't have access to the full collection config here
  // In a real implementation, you might want to store the full collection config in the analysis
  return analysis
}

/**
 * Analyze a PayloadCMS collection to extract field information
 */
export function analyzeCollection(
  collection: CollectionConfig,
  mcpOptions?: CollectionMcpOptions,
): CollectionAnalysis {
  const fields = collection.fields || []
  const fieldAnalyses: FieldAnalysis[] = []
  const excludeFields = mcpOptions?.excludeFields || []

  // Recursively analyze fields (including nested fields in groups, rows, etc.)
  function analyzeFields(fields: Field[], prefix = ''): void {
    for (const field of fields) {
      if (collection.slug.includes('migrations') || collection.slug.includes('preferences')) {
        continue
      }

      if ('name' in field && field.name) {
        const fieldName = prefix ? `${prefix}.${field.name}` : field.name

        // Skip excluded fields
        if (excludeFields.includes(fieldName)) {
          continue
        }

        const analysis = analyzeField(field, prefix)
        if (analysis) {
          fieldAnalyses.push(analysis)
        }
      }

      // Handle nested fields
      if (field.type === 'group' && 'fields' in field && field.fields && 'name' in field) {
        analyzeFields(field.fields, prefix ? `${prefix}.${field.name}` : field.name || '')
      } else if (field.type === 'row' && 'fields' in field && field.fields) {
        analyzeFields(field.fields, prefix)
      } else if (field.type === 'tabs' && 'tabs' in field && field.tabs) {
        for (const tab of field.tabs) {
          if ('fields' in tab && tab.fields) {
            analyzeFields(tab.fields, prefix)
          }
        }
      } else if (field.type === 'collapsible' && 'fields' in field && field.fields) {
        analyzeFields(field.fields, prefix)
      }
    }
  }

  analyzeFields(fields)

  return {
    slug: collection.slug,
    fields: fieldAnalyses,
    hasAuth: Boolean(collection.auth),
    hasUpload: Boolean(collection.upload),
    mcpOptions,
    timestamps: collection.timestamps !== false,
  }
}

/**
 * Analyze a single field to extract its properties
 */
function analyzeField(field: Field, prefix = ''): FieldAnalysis | null {
  if (!('name' in field) || !field.name) {
    return null
  }

  const fieldName = prefix ? `${prefix}.${field.name}` : field.name

  // Safely check for required property
  const isRequired = 'required' in field ? Boolean(field.required) : false

  // Safely check for description in admin config
  let description: string | undefined
  if ('admin' in field && field.admin && typeof field.admin === 'object') {
    const admin = field.admin as any
    description = typeof admin.description === 'string' ? admin.description : undefined
  }

  const base: FieldAnalysis = {
    name: fieldName,
    type: field.type,
    description,
    hasDefault: 'defaultValue' in field && field.defaultValue !== undefined,
    options: field.type === 'select' && 'options' in field ? (field as any).options : undefined,
    required: isRequired,
    validation: 'validate' in field ? (field as any).validate : undefined,
  }

  // String-like constraints
  if (
    field.type === 'text' ||
    field.type === 'textarea' ||
    field.type === 'email' ||
    field.type === 'code'
  ) {
    const minLength = (field as any).minLength
    const maxLength = (field as any).maxLength
    const pattern = (field as any).pattern
    const format = field.type === 'email' ? 'email' : undefined
    if (minLength || maxLength || pattern || format) {
      base.stringConstraints = {
        ...(typeof minLength === 'number' ? { minLength } : {}),
        ...(typeof maxLength === 'number' ? { maxLength } : {}),
        ...(typeof pattern === 'string' ? { pattern } : {}),
        ...(format ? { format } : {}),
      }
    }
  }

  // Number constraints
  if (field.type === 'number') {
    const min = (field as any).min
    const max = (field as any).max
    const integer = 'integer' in field ? Boolean((field as any).integer) : undefined
    base.numberConstraints = {
      ...(typeof min === 'number' ? { min } : {}),
      ...(typeof max === 'number' ? { max } : {}),
      ...(typeof integer === 'boolean' ? { integer } : {}),
    }
  }

  // Array constraints
  if (field.type === 'array' || field.type === 'blocks') {
    const minRows = (field as any).minRows
    const maxRows = (field as any).maxRows
    base.arrayConstraints = {
      ...(typeof minRows === 'number' ? { minItems: minRows } : {}),
      ...(typeof maxRows === 'number' ? { maxItems: maxRows } : {}),
    }
  }

  // Relationship metadata
  if (field.type === 'relationship') {
    const relationTo = (field as any).relationTo
    const hasMany = Boolean((field as any).hasMany)
    base.relationship = { hasMany, relationTo }
  }

  // Upload constraints
  if (field.type === 'upload') {
    const mimeTypes = (field as any).mimeTypes
    const maxFileSize = (field as any).maxFileSize
    base.uploadConstraints = {
      ...(Array.isArray(mimeTypes) ? { mimeTypes } : {}),
      ...(typeof maxFileSize === 'number' ? { maxFileSize } : {}),
    }
  }

  return base
}

/**
 * Create a list tool for a collection
 */
function createListTool(
  analysis: CollectionAnalysis,
  toolPrefix: string,
  collectionDescription: string,
): ToolDescriptor {
  return {
    name: `${toolPrefix}_list`,
    collection: analysis.slug,
    description: `List documents from the ${collectionDescription} with optional filtering, pagination, and sorting`,
    inputSchema: {
      type: 'object',
      properties: {
        depth: {
          type: 'number',
          default: 1,
          description: 'Depth of population for relationships',
          maximum: 10,
          minimum: 0,
        },
        isDraft: {
          type: 'boolean',
          description:
            "Whether to include draft documents (true for drafts, false for published, undefined for both). Maps to Payload's draft parameter.",
        },
        limit: {
          type: 'number',
          default: 10,
          description: 'Maximum number of documents to return',
          maximum: 100,
          minimum: 1,
        },
        page: {
          type: 'number',
          default: 1,
          description: 'Page number for pagination (1-based)',
          minimum: 1,
        },
        sort: {
          type: 'string',
          description: 'Sort field name (prefix with - for descending)',
          examples: ['createdAt', '-updatedAt', 'title'],
        },
        where: {
          type: 'object',
          additionalProperties: true,
          description: 'Query conditions for filtering documents',
        },
      },
    },
    operation: 'list' as ToolOperation,
    outputSchema: {
      type: 'object',
      properties: {
        docs: {
          type: 'array',
          items: createDocumentSchema(analysis),
        },
        hasNextPage: {
          type: 'boolean',
          description: 'Whether there is a next page',
        },
        hasPrevPage: {
          type: 'boolean',
          description: 'Whether there is a previous page',
        },
        limit: {
          type: 'number',
          description: 'Limit used for this query',
        },
        nextPage: {
          type: ['number', 'null'],
          description: 'Next page number or null',
        },
        page: {
          type: 'number',
          description: 'Current page number',
        },
        pagingCounter: {
          type: 'number',
          description: 'Paging counter',
        },
        prevPage: {
          type: ['number', 'null'],
          description: 'Previous page number or null',
        },
        totalDocs: {
          type: 'number',
          description: 'Total number of documents matching the query',
        },
        totalPages: {
          type: 'number',
          description: 'Total number of pages',
        },
      },
      required: ['docs', 'totalDocs', 'limit', 'totalPages', 'page'],
    },
  }
}

/**
 * Create a get tool for a collection
 */
function createGetTool(
  analysis: CollectionAnalysis,
  toolPrefix: string,
  collectionDescription: string,
): ToolDescriptor {
  return {
    name: `${toolPrefix}_get`,
    collection: analysis.slug,
    description: `Get a single document by ID from the ${collectionDescription}`,
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'The ID of the document to retrieve',
        },
        depth: {
          type: 'number',
          default: 1,
          description: 'Depth of population for relationships',
          maximum: 10,
          minimum: 0,
        },
        isDraft: {
          type: 'boolean',
          description:
            "Whether to include draft documents (true for drafts, false for published, undefined for both). Maps to Payload's draft parameter.",
        },
      },
      required: ['id'],
    },
    operation: 'get' as ToolOperation,
    outputSchema: createDocumentSchema(analysis),
  }
}

/**
 * Create a create tool for a collection
 */
function createCreateTool(
  analysis: CollectionAnalysis,
  toolPrefix: string,
  collectionDescription: string,
): ToolDescriptor {
  return {
    name: `${toolPrefix}_create`,
    collection: analysis.slug,
    description: `Create a new document in the ${collectionDescription}`,
    inputSchema: {
      type: 'object',
      properties: {
        data: createInputDataSchema(analysis),
        depth: {
          type: 'number',
          default: 1,
          description: 'Depth of population for relationships in response',
          maximum: 10,
          minimum: 0,
        },
      },
      required: ['data'],
    },
    operation: 'create' as ToolOperation,
    outputSchema: createDocumentSchema(analysis),
  }
}

/**
 * Create an update tool for a collection
 */
function createUpdateTool(
  analysis: CollectionAnalysis,
  toolPrefix: string,
  collectionDescription: string,
): ToolDescriptor {
  return {
    name: `${toolPrefix}_update`,
    collection: analysis.slug,
    description: `Update an existing document in the ${collectionDescription}`,
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'The ID of the document to update',
        },
        data: createInputDataSchema(analysis, false), // Not all fields required for updates
        depth: {
          type: 'number',
          default: 1,
          description: 'Depth of population for relationships in response',
          maximum: 10,
          minimum: 0,
        },
      },
      required: ['id', 'data'],
    },
    operation: 'update' as ToolOperation,
    outputSchema: createDocumentSchema(analysis),
  }
}

/**
 * Create a delete tool for a collection
 */
function createDeleteTool(
  analysis: CollectionAnalysis,
  toolPrefix: string,
  collectionDescription: string,
): ToolDescriptor {
  return {
    name: `${toolPrefix}_delete`,
    collection: analysis.slug,
    description: `Delete a document from the ${collectionDescription}`,
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'The ID of the document to delete',
        },
      },
      required: ['id'],
    },
    operation: 'delete' as ToolOperation,
    outputSchema: createDocumentSchema(analysis),
  }
}

/**
 * Create a JSON schema for a document based on collection analysis
 */
function createDocumentSchema(analysis: CollectionAnalysis): JSONSchema7 {
  const properties: Record<string, JSONSchema7> = {
    ...(analysis.isGlobal
      ? {}
      : {
          id: {
            type: 'string',
            description: 'Unique identifier for the document',
          },
        }),
  }

  // Add collection fields
  for (const field of analysis.fields) {
    properties[field.name] = createFieldSchema(field)
  }

  // Add timestamp fields if enabled
  if (analysis.timestamps) {
    properties.createdAt = {
      type: 'string',
      description: 'Document creation timestamp',
      format: 'date-time',
    }
    properties.updatedAt = {
      type: 'string',
      description: 'Document last update timestamp',
      format: 'date-time',
    }
  }

  return {
    type: 'object',
    properties,
    required: analysis.isGlobal ? undefined : ['id'],
  }
}

/**
 * Create input data schema (for create/update operations)
 */
function createInputDataSchema(
  analysis: CollectionAnalysis,
  allFieldsRequired = true,
): JSONSchema7 {
  const properties: Record<string, JSONSchema7> = {}
  const required: string[] = []

  // Add collection fields (excluding system fields)
  for (const field of analysis.fields) {
    if (field.name !== 'id' && field.name !== 'createdAt' && field.name !== 'updatedAt') {
      properties[field.name] = createFieldSchema(field)

      if (allFieldsRequired && field.required && !field.hasDefault) {
        required.push(field.name)
      }
    }
  }

  return {
    type: 'object',
    properties,
    required: required.length > 0 ? required : undefined,
  }
}

/**
 * Create a JSON schema for a field based on its analysis
 */
function createFieldSchema(field: FieldAnalysis): JSONSchema7 {
  const schema: JSONSchema7 = {}

  // Set description
  if (field.description) {
    schema.description = field.description
  }

  // Map PayloadCMS field types to JSON Schema types
  switch (field.type) {
    case 'array':
      schema.type = 'array'
      schema.items = { type: 'object', additionalProperties: true }
      if (field.arrayConstraints) {
        const { maxItems, minItems } = field.arrayConstraints
        if (typeof minItems === 'number') {schema.minItems = minItems}
        if (typeof maxItems === 'number') {schema.maxItems = maxItems}
      }
      break
    case 'blocks':
      schema.type = 'array'
      schema.items = { type: 'object', additionalProperties: true }
      break
    case 'checkbox':
      schema.type = 'boolean'
      break
    case 'code':
    case 'email':
    case 'text':
    case 'textarea':
      schema.type = 'string'
      if (field.type === 'email') {
        schema.format = 'email'
      }
      if (field.stringConstraints) {
        const { format, maxLength, minLength, pattern } = field.stringConstraints
        if (typeof minLength === 'number') {schema.minimum = minLength as any}
        if (typeof maxLength === 'number') {schema.maximum = maxLength as any}
        if (pattern) {schema.pattern = pattern as any}
        if (format) {schema.format = format}
      }
      break

    case 'date':
      schema.type = 'string'
      schema.format = 'date-time'
      break

    case 'group':
      schema.type = 'object'
      schema.additionalProperties = true
      break

    case 'json':
      schema.type = 'object'
      schema.additionalProperties = true
      break

    case 'number':
      schema.type = 'number'
      if (field.numberConstraints) {
        const { max, min } = field.numberConstraints
        if (typeof min === 'number') {schema.minimum = min}
        if (typeof max === 'number') {schema.maximum = max}
      }
      break

    case 'point':
      schema.type = 'array'
      schema.items = { type: 'number' }
      schema.minItems = 2
      schema.maxItems = 2
      break
    case 'radio':
      if (field.options && Array.isArray(field.options)) {
        schema.type = 'string'
        schema.enum = field.options.map((opt) =>
          typeof opt === 'string' ? opt : opt.value || opt.label,
        )
      } else {
        schema.type = 'string'
      }
      break

    case 'relationship':
      schema.oneOf = [
        { type: 'string', description: 'Document ID' },
        { type: 'object', description: 'Populated document' },
      ]
      break

    case 'richText':
      schema.type = 'string'
      schema.description = 'Rich text content (Markdown string)'
      schema.examples = ['# Title\n\nSome **bold** text.']
      break

    case 'select':
      if (field.options && Array.isArray(field.options)) {
        schema.type = 'string'
        schema.enum = field.options.map((opt) =>
          typeof opt === 'string' ? opt : opt.value || opt.label,
        )
      } else {
        schema.type = 'string'
      }
      break

    case 'upload':
      schema.oneOf = [
        { type: 'string', description: 'File ID' },
        { type: 'object', description: 'File document' },
      ]
      break

    default:
      // For unknown field types, allow any value
      schema.type = ['string', 'number', 'boolean', 'object', 'array', 'null']
      break
  }

  // Relationship hints in description
  if (field.type === 'relationship' && field.relationship) {
    const hint = `Relation to: ${Array.isArray(field.relationship.relationTo) ? field.relationship.relationTo.join(',') : field.relationship.relationTo}; hasMany: ${field.relationship.hasMany}`
    schema.description = schema.description ? `${schema.description} | ${hint}` : hint
  }

  return schema
}

/**
 * Execute a tool with the given input
 */
export async function executeTool(
  toolDescriptor: ToolDescriptor,
  input: any,
  payload: BasePayload,
  analysis: CollectionAnalysis,
  allowedOperations?: {
    create?: boolean
    delete?: boolean
    get?: boolean
    list?: boolean
    update?: boolean
  },
  mcpOptions?: {
    richText?: {
      truncateInList?: number
    }
  },
): Promise<any> {
  const { collection, operation } = toolDescriptor
  if (!payload) {
    throw new Error('Payload instance not available')
  }

  if (collection === 'all') {
    throw new Error('Collection must be specified')
  }

  // Defense in depth: ensure operation is allowed when provided
  if (allowedOperations && allowedOperations[operation] === false) {
    throw new Error(`Operation '${operation}' is not allowed for collection '${collection}'`)
  }

  /**
   * CRITICAL FIX: Mock Request Object for Hook Triggering
   *
   * PayloadCMS's Local API methods (payload.create, payload.update, etc.) do NOT trigger
   * collection hooks by default. Hooks are only triggered when a `req` object is present.
   *
   * By creating and passing this mock request object, we ensure that:
   * 1. Collection hooks (beforeChange, afterChange, etc.) are triggered
   * 2. Our revalidation callbacks can execute properly
   * 3. The application maintains cache consistency
   *
   * PERFORMANCE IMPACT:
   * - MINIMAL OVERHEAD: Creating this lightweight object adds negligible overhead (<1ms)
   * - HOOK EXECUTION: The real performance impact comes from the hooks themselves:
   *   - Each hook adds processing time (varies by hook complexity)
   *   - Revalidation hooks that call revalidateTag() are typically fast (1-5ms per tag)
   *   - Database hooks or external API calls in hooks will add their respective latencies
   *
   * TRADE-OFFS:
   * - WITHOUT this: Operations are faster but hooks don't run (breaking revalidation)
   * - WITH this: Slight performance decrease but ensures data consistency
   *
   * The performance cost is generally worth it for maintaining cache coherency and
   * triggering necessary side effects. If performance becomes critical, consider:
   * 1. Optimizing individual hooks
   * 2. Using selective hook triggering based on context
   * 3. Implementing async/background processing for heavy operations
   */
  const auth = getAuthContext()
  const mockReq = {
    context: {
      /**
       * This context object can be used to:
       * 1. Identify that this operation came from MCP
       * 2. Pass additional metadata to hooks
       * 3. Conditionally execute certain hooks
       */
      fromMCP: true, // Flag to identify MCP operations in hooks
      scopes: auth?.scopes,
      tokenId: auth?.tokenId,
      triggerAfterChange: true, // Explicitly indicate hooks should run
    },
    fallbackLocale: undefined, // Optional: fallback locale for i18n
    locale: input.locale || undefined, // Optional: pass locale if provided in input
    payload, // Required: reference to the Payload instance
    user: auth?.userId ? ({ id: auth.userId, role: auth.userRole } as any) : null, // If token is user-linked, impersonate for access control
    /**
     * Note: We're not including all properties of a real Express Request object
     * (headers, cookies, etc.) as they're not needed for hook execution.
     * This minimal approach keeps memory usage low.
     */
  } as any

  // Log for debugging (can be removed in production)
  console.log(`[MCP] Executing ${operation} on ${collection} with mock req for hook triggering`)

  // Enforce per-tool scope checks based on token scopes
  const scopes = auth?.scopes || []
  const collectionScopePrefix = `collections:${String(collection)}`
  const has = (target: string) => scopes.includes(target)

  const opToWrite = (op: string) => op === 'create' || op === 'update' || op === 'delete'

  const allowedByScopes =
    has('collections:*:*') ||
    has(`${collectionScopePrefix}:*`) ||
    (operation === 'list' || operation === 'get'
      ? has('collections:*:read') ||
        has(`${collectionScopePrefix}:read`) ||
        has(`${collectionScopePrefix}:${operation}`)
      : has('collections:*:write') ||
        has(`${collectionScopePrefix}:write`) ||
        has(`${collectionScopePrefix}:${operation}`))

  if (!allowedByScopes) {
    throw new Error(
      `MCP token lacks scope for ${String(collection)} ${operation}. Required one of: collections:*:*, ${collectionScopePrefix}:*, collections:*:${opToWrite(operation) ? 'write' : 'read'}, ${collectionScopePrefix}:${opToWrite(operation) ? 'write' : 'read'}, ${collectionScopePrefix}:${operation}`,
    )
  }

  switch (operation) {
    case 'create':
      if (analysis.isGlobal) {throw new Error('Create operation is not supported for globals')}
      return await (async () => {
        const processedData = await convertMarkdownFieldsToLexicalForData(
          input.data || {},
          analysis,
          payload.config,
        )
        /**
         * CREATE operations trigger:
         * - beforeValidate hooks
         * - beforeChange hooks
         * - afterChange hooks (THIS IS WHERE REVALIDATION HAPPENS)
         * - afterRead hooks (when returning the created document)
         *
         * Performance impact depends on hook complexity but typically adds 10-50ms total.
         */
        const result = await payload.create({
          collection,
          data: processedData,
          depth: input.depth || 1,
          req: mockReq, // CRITICAL: Pass mock request to trigger afterChange hooks
        })
        const finalResult = await attachMarkdownFromLexicalInResult(
          result,
          analysis,
          payload.config,
          mcpOptions?.richText,
          false,
        )
        return finalResult
      })()

    case 'delete':
      if (analysis.isGlobal) {throw new Error('Delete operation is not supported for globals')}
      return await (async () => {
        /**
         * DELETE operations trigger:
         * - beforeDelete hooks
         * - afterDelete hooks (THIS IS WHERE REVALIDATION HAPPENS)
         *
         * Generally the fastest operation as no validation is needed.
         * Revalidation adds similar overhead as other operations.
         */
        const deleted = await payload.delete({
          id: input.id,
          collection,
          req: mockReq, // CRITICAL: Pass mock request to trigger afterDelete hooks
        })
        return deleted
      })()

    case 'get':
      return await (async () => {
        /**
         * GET operations trigger:
         * - beforeRead hooks
         * - afterRead hooks
         * Performance impact is minimal unless hooks perform heavy operations.
         */
        const result = analysis.isGlobal
          ? await (payload as any).findGlobal({
              slug: String(collection),
              depth: input.depth || 1,
              draft: input.isDraft,
              req: mockReq, // Pass mock request for global operations too
            })
          : await payload.findByID({
              id: input.id,
              collection,
              depth: input.depth || 1,
              draft: input.isDraft,
              req: mockReq, // Pass mock request to trigger read hooks
            })
        return await attachMarkdownFromLexicalInResult(
          result,
          analysis,
          payload.config,
          mcpOptions?.richText,
          false,
        )
      })()

    case 'list':
      if (analysis.isGlobal) {throw new Error('List operation is not supported for globals')}
      return await (async () => {
        /**
         * LIST operations typically don't trigger change hooks, but may trigger:
         * - beforeRead hooks
         * - afterRead hooks
         * These are generally lightweight and add minimal overhead.
         */
        const result = await payload.find({
          collection,
          depth: input.depth || 1,
          draft: input.isDraft,
          limit: input.limit || 10,
          page: input.page || 1,
          req: mockReq, // Pass mock request to trigger read hooks
          sort: input.sort,
          where: input.where || {},
        })
        return await attachMarkdownFromLexicalInResult(
          result,
          analysis,
          payload.config,
          mcpOptions?.richText,
          true,
        )
      })()

    case 'update':
      return await (async () => {
        const processedData = await convertMarkdownFieldsToLexicalForData(
          input.data || {},
          analysis,
          payload.config,
        )
        /**
         * UPDATE operations trigger:
         * - beforeValidate hooks
         * - beforeChange hooks
         * - afterChange hooks (THIS IS WHERE REVALIDATION HAPPENS)
         * - afterRead hooks (when returning the updated document)
         *
         * Performance considerations:
         * - Hooks have access to both previous and new document states
         * - Comparison operations in hooks may add overhead
         * - Revalidation typically adds 5-20ms depending on number of tags
         */
        const result = analysis.isGlobal
          ? await (payload as any).updateGlobal({
              slug: String(collection),
              data: processedData,
              depth: input.depth || 1,
              req: mockReq, // CRITICAL: Pass mock request for global updates
            })
          : await payload.update({
              id: input.id,
              collection,
              data: processedData,
              depth: input.depth || 1,
              req: mockReq, // CRITICAL: Pass mock request to trigger afterChange hooks
            })
        const finalResult = await attachMarkdownFromLexicalInResult(
          result,
          analysis,
          payload.config,
          mcpOptions?.richText,
          false,
        )
        return finalResult
      })()

    default:
      throw new Error(`Unknown operation: ${operation}`)
  }
}
