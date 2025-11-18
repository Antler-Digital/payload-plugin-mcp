/* eslint-disable @typescript-eslint/no-explicit-any */
import type { BasePayload, CollectionConfig, CollectionSlug, Field, SelectType } from 'payload'

import type {
  CollectionAnalysis,
  CollectionMcpOptions,
  FieldAnalysis,
  JSONSchema7,
  ToolDescriptor,
  ToolOperation,
} from '../types/index.js'

import { getAuthContext } from '../auth-context.js'
import { formatCollectionDescription } from './format-collection-description.js'
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
      completeAnalysis.mcpOptions?.description || formatCollectionDescription(completeAnalysis)

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

  // Extract useAsTitle from collection admin config
  const useAsTitle =
    collection.admin && typeof collection.admin === 'object' && 'useAsTitle' in collection.admin
      ? String((collection.admin as any).useAsTitle)
      : undefined

  return {
    slug: collection.slug as CollectionSlug,
    fields: fieldAnalyses,
    hasAuth: Boolean(collection.auth),
    hasUpload: Boolean(collection.upload),
    hasVersions: Boolean(collection.versions),
    mcpOptions,
    timestamps: collection.timestamps !== false,
    useAsTitle,
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
    exampleValue: generateExampleValue(field),
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

  // Array constraints and nested fields
  if (field.type === 'array' || field.type === 'blocks') {
    const minRows = (field as any).minRows
    const maxRows = (field as any).maxRows
    base.arrayConstraints = {
      ...(typeof minRows === 'number' ? { minItems: minRows } : {}),
      ...(typeof maxRows === 'number' ? { maxItems: maxRows } : {}),
    }
    // Analyze nested fields for arrays
    if ('fields' in field && field.fields) {
      base.arrayItemFields = (field.fields as Field[])
        .map((f) => analyzeField(f))
        .filter(Boolean) as FieldAnalysis[]
    }
  }

  // Group fields
  if (field.type === 'group' && 'fields' in field && field.fields) {
    base.groupFields = (field.fields as Field[])
      .map((f) => analyzeField(f))
      .filter(Boolean) as FieldAnalysis[]
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
 * Generate an example value for a field based on its type
 */
function generateExampleValue(field: Field): any {
  if (!('type' in field)) {
    return undefined
  }

  switch (field.type) {
    case 'array':
      return []
    case 'checkbox':
      return true
    case 'code':
      return 'const example = "code";'
    case 'date':
      return '2024-01-01T00:00:00.000Z'
    case 'email':
      return 'example@email.com'
    case 'group':
      return {}
    case 'json':
      return { key: 'value' }
    case 'number':
      return 42
    case 'point':
      return [0, 0]
    case 'radio':
    case 'select':
      if (
        'options' in field &&
        field.options &&
        Array.isArray(field.options) &&
        field.options.length > 0
      ) {
        const firstOption = field.options[0]
        return typeof firstOption === 'string' ? firstOption : firstOption.value
      }
      return 'option1'
    case 'relationship': {
      const hasMany = 'hasMany' in field && Boolean((field as any).hasMany)
      return hasMany ? ['related_id_1', 'related_id_2'] : 'related_id'
    }
    case 'richText':
      return 'Rich text content in Markdown format'
    case 'text':
    case 'textarea':
      return 'Example text'
    case 'upload':
      return 'upload_id'
    default:
      return undefined
  }
}

/**
 * Generate collection-specific where clause examples using only exposed fields
 */
function generateWhereExamples(analysis: CollectionAnalysis): string {
  const examples: string[] = []

  // Only use fields that aren't excluded (analysis.fields is already filtered)
  const stringField = analysis.fields.find((f) =>
    ['email', 'select', 'text', 'textarea'].includes(f.type),
  )
  const boolField = analysis.fields.find((f) => f.type === 'checkbox')

  // Generate simple example
  if (stringField) {
    examples.push(`{ ${stringField.name}: { equals: 'value' } }`)
  } else if (boolField) {
    examples.push(`{ ${boolField.name}: { equals: true } }`)
  }

  // Always add _status example for draft filtering
  const statusExample = `{ _status: { equals: 'published' } }`
  if (examples.length === 0) {
    examples.push(statusExample)
  } else {
    examples.push(`{ and: [${examples[0]}, ${statusExample}] }`)
  }

  return examples.length ? `Examples: ${examples.join(' or ')}` : ''
}
function createListTool(
  analysis: CollectionAnalysis,
  toolPrefix: string,
  collectionDescription: string,
): ToolDescriptor {
  const whereExamples = generateWhereExamples(analysis)
  const whereDescription =
    `PayloadCMS query object for filtering. Operators: equals, not_equals, like, contains, in, not_in, greater_than, less_than, exists. Supports and/or logic. Use _status field to filter by draft/published status. ${whereExamples}`.trim()
  const properties: Record<string, any> = {
    depth: {
      type: 'number',
      default: 0,
      description:
        'Depth of population for relationships (max: 3). WARNING: Higher depth values consume tokens exponentially faster. Prefer depth 0 and fetch related items separately if needed.',
      maximum: 3,
      minimum: 0,
    },
  }

  // Only add isDraft if collection has versions enabled
  if (analysis.hasVersions) {
    properties.isDraft = {
      type: 'boolean',
      description:
        'Filter by draft status: true for drafts only, false for published only, undefined for both. Only available when collection has versions enabled.',
    }
  }

  properties.limit = {
    type: 'number',
    default: 5,
    description:
      'Maximum number of documents to return (default: 5, max: 10). Use pagination (page parameter) to access more results.',
    maximum: 10,
    minimum: 1,
  }
  properties.page = {
    type: 'number',
    default: 1,
    description: 'Page number for pagination (1-based)',
    minimum: 1,
  }
  properties.sort = {
    type: 'string',
    description: 'Sort field name (prefix with - for descending)',
    examples: ['createdAt', '-updatedAt', 'title'],
  }
  properties.where = {
    type: 'object',
    description: whereDescription,
  }
  properties.fields = {
    type: 'array',
    description:
      "Optional list of field paths to return (dot notation). If omitted, Payload returns all available fields. Provide this to limit responses to just the fields you need. Use dot notation for nested fields (e.g., 'user.email').",
    items: { type: 'string' },
  }

  return {
    name: `${toolPrefix}_list`,
    description: `List documents from the ${collectionDescription} with optional filtering, pagination, and sorting. IMPORTANT: Always use 'where' filters to narrow results and reduce token usage—avoid fetching all documents when you can filter by specific criteria (status, dates, relationships, etc.). By default, all fields are returned; use the 'fields' parameter to explicitly limit the response when you only need a subset of fields.`,
    collection: analysis.slug,
    inputSchema: {
      type: 'object',
      properties,
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
  // Check if collection has slug or title fields for alternative lookup
  const hasSlugField = analysis.fields.some((field) => field.name === 'slug')
  const hasTitleField = analysis.fields.some((field) => field.name === 'title')

  const properties: Record<string, any> = {
    depth: {
      type: 'number',
      default: 0,
      description: 'Depth of population for relationships',
      maximum: 10,
      minimum: 0,
    },
    isDraft: {
      type: 'boolean',
      description:
        'Whether to return draft version (true) or published version (false). Omit to get the latest regardless of status.',
    },
    fields: {
      type: 'array',
      description:
        "Optional list of field paths to return (dot notation). If omitted, Payload returns all fields. Provide this to limit responses to just the fields you need. Use dot notation for nested fields (e.g., 'user.email').",
      items: { type: 'string' },
    },
  }

  const required: string[] = []

  // Add ID field (always available)
  properties.id = {
    type: 'string',
    description: 'The ID of the document to retrieve',
  }

  // Add slug field if available
  if (hasSlugField) {
    properties.slug = {
      type: 'string',
      description: 'The slug of the document to retrieve (alternative to ID)',
    }
  }

  // Add title field if available
  if (hasTitleField) {
    properties.title = {
      type: 'string',
      description: 'The title of the document to retrieve (alternative to ID)',
    }
  }

  // Create description based on available fields
  let description = `Get a single document from the ${collectionDescription}.`
  const lookupMethods = ['ID']
  if (hasSlugField) {
    lookupMethods.push('slug')
  }
  if (hasTitleField) {
    lookupMethods.push('title')
  }

  description += ` You can lookup by: ${lookupMethods.join(', ')}.`
  description += ` RECOMMENDED: Use the 'fields' parameter to explicitly limit responses to just the data you need for your task. When omitted, Payload returns all available fields. Keep depth at 0 (default) unless you specifically need populated relationships.`

  // Make exactly one of the identifier fields required
  if (hasSlugField || hasTitleField) {
    properties.oneOf = [
      { required: ['id'] },
      ...(hasSlugField ? [{ required: ['slug'] }] : []),
      ...(hasTitleField ? [{ required: ['title'] }] : []),
    ]
  } else {
    required.push('id')
  }

  return {
    name: `${toolPrefix}_get`,
    description,
    collection: analysis.slug,
    inputSchema: {
      type: 'object',
      properties,
      ...(required.length > 0 && { required }),
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
          default: 0,
          description:
            'Depth of population for relationships in response (max: 3). WARNING: Higher depth values consume tokens exponentially faster. Prefer depth 0 and fetch related items separately if needed.',
          maximum: 3,
          minimum: 0,
        },
        fields: {
          type: 'array',
          description:
            "Optional list of field paths to return in response (dot notation). If omitted, Payload returns all fields. Provide this to limit responses to just the data you need. Use dot notation for nested fields (e.g., 'user.email').",
          items: { type: 'string' },
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
          default: 0,
          description:
            'Depth of population for relationships in response (max: 3). WARNING: Higher depth values consume tokens exponentially faster. Prefer depth 0 and fetch related items separately if needed.',
          maximum: 3,
          minimum: 0,
        },
        fields: {
          type: 'array',
          description:
            "Optional list of field paths to return in response (dot notation). If omitted, Payload returns all fields. Provide this to limit responses to just the data you need. Use dot notation for nested fields (e.g., 'user.email').",
          items: { type: 'string' },
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
        if (typeof minItems === 'number') {
          schema.minItems = minItems
        }
        if (typeof maxItems === 'number') {
          schema.maxItems = maxItems
        }
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
        if (typeof minLength === 'number') {
          schema.minimum = minLength as any
        }
        if (typeof maxLength === 'number') {
          schema.maximum = maxLength as any
        }
        if (pattern) {
          schema.pattern = pattern as any
        }
        if (format) {
          schema.format = format
        }
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
        if (typeof min === 'number') {
          schema.minimum = min
        }
        if (typeof max === 'number') {
          schema.maximum = max
        }
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
 * Convert fields array to PayloadCMS select format
 * PayloadCMS select expects a flat object with field names as keys and true as values
 */
function convertFieldsToSelect(
  fields?: string[] | null,
  isGlobal = false,
  _useAsTitle?: string,
): SelectType | undefined {
  // If fields are explicitly provided, use them
  if (fields && fields.length > 0) {
    const select: Record<string, true> = {}
    let hasValidFields = false

    for (const field of fields) {
      if (typeof field === 'string' && field.trim() !== '') {
        const trimmedField = field.trim()
        select[trimmedField] = true
        hasValidFields = true
      }
    }

    // Always include id for collections unless explicitly excluded
    if (!isGlobal && hasValidFields && !select.id) {
      select.id = true
    }

    return hasValidFields ? select : undefined
  }

  return undefined
}

function buildDraftAwareWhere(
  baseWhere: Record<string, any> | undefined,
  isDraft?: boolean,
): Record<string, any> | undefined {
  if (typeof isDraft !== 'boolean') {
    return baseWhere
  }

  const statusCondition = {
    _status: {
      equals: isDraft ? 'draft' : 'published',
    },
  }

  if (!baseWhere || Object.keys(baseWhere).length === 0) {
    return statusCondition
  }

  return {
    and: [baseWhere, statusCondition],
  }
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
      if (analysis.isGlobal) {
        throw new Error('Create operation is not supported for globals')
      }
      return await (async () => {
        const processedData = await convertMarkdownFieldsToLexicalForData(
          input.data || {},
          analysis,
          payload.config,
        )
        const select = convertFieldsToSelect(input.fields, false, analysis.useAsTitle) // Collections are not global

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
          collection: collection as CollectionSlug,
          data: processedData,
          depth: input.depth ?? 0,
          req: mockReq, // CRITICAL: Pass mock request to trigger afterChange hooks
          ...(select && { select }), // Use PayloadCMS native select for field filtering in response
        })
        const withMd = await attachMarkdownFromLexicalInResult(
          result,
          analysis,
          payload.config,
          mcpOptions?.richText,
          false,
        )
        return withMd
      })()

    case 'delete':
      if (analysis.isGlobal) {
        throw new Error('Delete operation is not supported for globals')
      }
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
          collection: collection as CollectionSlug,
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
        const select = convertFieldsToSelect(input.fields, analysis.isGlobal, analysis.useAsTitle)

        if (analysis.isGlobal) {
          const result = await (payload as any).findGlobal({
            slug: String(collection),
            depth: input.depth ?? 0,
            ...(typeof input.isDraft === 'boolean' ? { draft: input.isDraft } : {}),
            req: mockReq, // Pass mock request for global operations too
            ...(select && { select }), // Use PayloadCMS native select for field filtering
          })
          const withMd = await attachMarkdownFromLexicalInResult(
            result,
            analysis,
            payload.config,
            mcpOptions?.richText,
            false,
          )
          return withMd
        }

        // Handle collection lookups by ID, slug, or title
        let result
        if (input.id) {
          // Direct ID lookup
          result = await payload.findByID({
            id: input.id,
            collection: collection as CollectionSlug,
            depth: input.depth ?? 0,
            ...(typeof input.isDraft === 'boolean' ? { draft: input.isDraft } : {}),
            req: mockReq,
            ...(select && { select }),
          })
        } else if (input.slug) {
          // Lookup by slug
          const slugWhere = buildDraftAwareWhere(
            {
              slug: {
                equals: input.slug,
              },
            },
            input.isDraft,
          )
          const slugResults = await payload.find({
            collection: collection as CollectionSlug,
            depth: input.depth ?? 0,
            ...(typeof input.isDraft === 'boolean' ? { draft: input.isDraft } : {}),
            limit: 1,
            req: mockReq,
            ...(slugWhere ? { where: slugWhere } : {}),
            ...(select && { select }),
          })

          if (slugResults.docs.length === 0) {
            throw new Error(`Document with slug "${input.slug}" not found`)
          }

          result = slugResults.docs[0]
        } else if (input.title) {
          // Lookup by title
          const titleWhere = buildDraftAwareWhere(
            {
              title: {
                equals: input.title,
              },
            },
            input.isDraft,
          )
          const titleResults = await payload.find({
            collection: collection as CollectionSlug,
            depth: input.depth ?? 0,
            ...(typeof input.isDraft === 'boolean' ? { draft: input.isDraft } : {}),
            limit: 1,
            req: mockReq,
            ...(titleWhere ? { where: titleWhere } : {}),
            ...(select && { select }),
          })

          if (titleResults.docs.length === 0) {
            throw new Error(`Document with title "${input.title}" not found`)
          }

          result = titleResults.docs[0]
        } else {
          throw new Error('Must provide either id, slug, or title to retrieve a document')
        }

        const withMd = await attachMarkdownFromLexicalInResult(
          result,
          analysis,
          payload.config,
          mcpOptions?.richText,
          false,
        )
        // No need for client-side projection since PayloadCMS select already filtered the fields
        return withMd
      })()

    case 'list':
      if (analysis.isGlobal) {
        throw new Error('List operation is not supported for globals')
      }
      return await (async () => {
        /**
         * LIST operations typically don't trigger change hooks, but may trigger:
         * - beforeRead hooks
         * - afterRead hooks
         * These are generally lightweight and add minimal overhead.
         */
        const select = convertFieldsToSelect(input.fields, false, analysis.useAsTitle) // Collections are not global
        const listWhere = buildDraftAwareWhere(input.where, input.isDraft)

        const result = await payload.find({
          collection: collection as CollectionSlug,
          depth: input.depth ?? 0,
          ...(typeof input.isDraft === 'boolean' ? { draft: input.isDraft } : {}),
          limit: input.limit || 5,
          page: input.page || 1,
          sort: input.sort,
          ...(listWhere ? { where: listWhere } : {}),
          req: mockReq, // Pass mock request to trigger read hooks
          ...(select && { select }), // Use PayloadCMS native select for field filtering
        })

        const withMd = await attachMarkdownFromLexicalInResult(
          result,
          analysis,
          payload.config,
          mcpOptions?.richText,
          true,
        )
        // No need for client-side projection since PayloadCMS select already filtered the fields
        return withMd
      })()

    case 'update':
      return await (async () => {
        const processedData = await convertMarkdownFieldsToLexicalForData(
          input.data || {},
          analysis,
          payload.config,
        )
        const select = convertFieldsToSelect(input.fields, analysis.isGlobal, analysis.useAsTitle)

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
              depth: input.depth ?? 0,
              req: mockReq, // CRITICAL: Pass mock request for global updates
              ...(select && { select }), // Use PayloadCMS native select for field filtering in response
            })
          : await payload.update({
              id: input.id,
              collection: collection as CollectionSlug,
              data: processedData,
              depth: input.depth ?? 0,
              req: mockReq, // CRITICAL: Pass mock request to trigger afterChange hooks
              ...(select && { select }), // Use PayloadCMS native select for field filtering in response
            })
        const withMd = await attachMarkdownFromLexicalInResult(
          result,
          analysis,
          payload.config,
          mcpOptions?.richText,
          false,
        )
        // No need for client-side projection since PayloadCMS select already filtered the fields
        return withMd
      })()

    default:
      throw new Error(`Unknown operation: ${String(operation)}`)
  }
}

// Note: Client-side projection functions removed since we now use PayloadCMS native select parameter
// This provides better performance by filtering at the database level rather than after retrieval
