import type { CollectionConfig, Field } from 'payload'
import { 
  ToolDescriptor, 
  ToolOperations, 
  FieldAnalysis, 
  CollectionAnalysis,
  ToolOperation,
  JSONSchema7,
  CollectionMcpOptions 
} from '../types/index.js'

/**
 * Generate MCP tool descriptors from PayloadCMS collections with their MCP configurations
 */
export function generateToolDescriptors(
  collectionAnalyses: CollectionAnalysis[]
): ToolDescriptor[] {
  const descriptors: ToolDescriptor[] = []

  for (const analysis of collectionAnalyses) {
    // Get the complete collection analysis (populate fields if needed)
    const completeAnalysis = analysis.fields.length > 0 
      ? analysis 
      : completeCollectionAnalysis(analysis)
    
    const operations = completeAnalysis.mcpOptions?.operations || {
      list: true,
      get: true,
      create: false,
      update: false,
      delete: false,
    }

    const toolPrefix = completeAnalysis.mcpOptions?.toolPrefix || completeAnalysis.slug
    const collectionDescription = completeAnalysis.mcpOptions?.description || `${completeAnalysis.slug} collection`
    
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
  mcpOptions?: CollectionMcpOptions
): CollectionAnalysis {
  const fields = collection.fields || []
  const fieldAnalyses: FieldAnalysis[] = []
  const excludeFields = mcpOptions?.excludeFields || []

  // Recursively analyze fields (including nested fields in groups, rows, etc.)
  function analyzeFields(fields: Field[], prefix = ''): void {
    for (const field of fields) {
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
      if (field.type === 'group' && 'fields' in field && field.fields) {
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
    hasUpload: Boolean(collection.upload),
    hasAuth: Boolean(collection.auth),
    timestamps: collection.timestamps !== false,
    mcpOptions,
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
  
  return {
    name: fieldName,
    type: field.type,
    required: isRequired,
    hasDefault: 'defaultValue' in field && field.defaultValue !== undefined,
    description,
    options: field.type === 'select' && 'options' in field ? field.options : undefined,
    validation: 'validate' in field ? field.validate : undefined,
  }
}

/**
 * Create a list tool for a collection
 */
function createListTool(
  analysis: CollectionAnalysis, 
  toolPrefix: string, 
  collectionDescription: string
): ToolDescriptor {
  return {
    name: `${toolPrefix}_list`,
    description: `List documents from the ${collectionDescription} with optional filtering, pagination, and sorting`,
    collection: analysis.slug,
    operation: 'list' as ToolOperation,
    inputSchema: {
      type: 'object',
      properties: {
        where: {
          type: 'object',
          description: 'Query conditions for filtering documents',
          additionalProperties: true,
        },
        limit: {
          type: 'number',
          description: 'Maximum number of documents to return',
          minimum: 1,
          maximum: 100,
          default: 10,
        },
        page: {
          type: 'number',
          description: 'Page number for pagination (1-based)',
          minimum: 1,
          default: 1,
        },
        sort: {
          type: 'string',
          description: 'Sort field name (prefix with - for descending)',
          examples: ['createdAt', '-updatedAt', 'title'],
        },
        depth: {
          type: 'number',
          description: 'Depth of population for relationships',
          minimum: 0,
          maximum: 10,
          default: 1,
        },
      },
    },
    outputSchema: {
      type: 'object',
      properties: {
        docs: {
          type: 'array',
          items: createDocumentSchema(analysis),
        },
        totalDocs: {
          type: 'number',
          description: 'Total number of documents matching the query',
        },
        limit: {
          type: 'number',
          description: 'Limit used for this query',
        },
        totalPages: {
          type: 'number',
          description: 'Total number of pages',
        },
        page: {
          type: 'number',
          description: 'Current page number',
        },
        pagingCounter: {
          type: 'number',
          description: 'Paging counter',
        },
        hasPrevPage: {
          type: 'boolean',
          description: 'Whether there is a previous page',
        },
        hasNextPage: {
          type: 'boolean',
          description: 'Whether there is a next page',
        },
        prevPage: {
          type: ['number', 'null'],
          description: 'Previous page number or null',
        },
        nextPage: {
          type: ['number', 'null'],
          description: 'Next page number or null',
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
  collectionDescription: string
): ToolDescriptor {
  return {
    name: `${toolPrefix}_get`,
    description: `Get a single document by ID from the ${collectionDescription}`,
    collection: analysis.slug,
    operation: 'get' as ToolOperation,
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'The ID of the document to retrieve',
        },
        depth: {
          type: 'number',
          description: 'Depth of population for relationships',
          minimum: 0,
          maximum: 10,
          default: 1,
        },
      },
      required: ['id'],
    },
    outputSchema: createDocumentSchema(analysis),
  }
}

/**
 * Create a create tool for a collection
 */
function createCreateTool(
  analysis: CollectionAnalysis, 
  toolPrefix: string, 
  collectionDescription: string
): ToolDescriptor {
  return {
    name: `${toolPrefix}_create`,
    description: `Create a new document in the ${collectionDescription}`,
    collection: analysis.slug,
    operation: 'create' as ToolOperation,
    inputSchema: {
      type: 'object',
      properties: {
        data: createInputDataSchema(analysis),
        depth: {
          type: 'number',
          description: 'Depth of population for relationships in response',
          minimum: 0,
          maximum: 10,
          default: 1,
        },
      },
      required: ['data'],
    },
    outputSchema: createDocumentSchema(analysis),
  }
}

/**
 * Create an update tool for a collection
 */
function createUpdateTool(
  analysis: CollectionAnalysis, 
  toolPrefix: string, 
  collectionDescription: string
): ToolDescriptor {
  return {
    name: `${toolPrefix}_update`,
    description: `Update an existing document in the ${collectionDescription}`,
    collection: analysis.slug,
    operation: 'update' as ToolOperation,
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
          description: 'Depth of population for relationships in response',
          minimum: 0,
          maximum: 10,
          default: 1,
        },
      },
      required: ['id', 'data'],
    },
    outputSchema: createDocumentSchema(analysis),
  }
}

/**
 * Create a delete tool for a collection
 */
function createDeleteTool(
  analysis: CollectionAnalysis, 
  toolPrefix: string, 
  collectionDescription: string
): ToolDescriptor {
  return {
    name: `${toolPrefix}_delete`,
    description: `Delete a document from the ${collectionDescription}`,
    collection: analysis.slug,
    operation: 'delete' as ToolOperation,
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
    outputSchema: createDocumentSchema(analysis),
  }
}

/**
 * Create a JSON schema for a document based on collection analysis
 */
function createDocumentSchema(analysis: CollectionAnalysis): JSONSchema7 {
  const properties: Record<string, JSONSchema7> = {
    id: {
      type: 'string',
      description: 'Unique identifier for the document',
    },
  }

  // Add collection fields
  for (const field of analysis.fields) {
    properties[field.name] = createFieldSchema(field)
  }

  // Add timestamp fields if enabled
  if (analysis.timestamps) {
    properties.createdAt = {
      type: 'string',
      format: 'date-time',
      description: 'Document creation timestamp',
    }
    properties.updatedAt = {
      type: 'string',
      format: 'date-time',
      description: 'Document last update timestamp',
    }
  }

  return {
    type: 'object',
    properties,
    required: ['id'],
  }
}

/**
 * Create input data schema (for create/update operations)
 */
function createInputDataSchema(analysis: CollectionAnalysis, allFieldsRequired = true): JSONSchema7 {
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
    case 'text':
    case 'textarea':
    case 'code':
    case 'email':
      schema.type = 'string'
      if (field.type === 'email') {
        schema.format = 'email'
      }
      break

    case 'number':
      schema.type = 'number'
      break

    case 'checkbox':
      schema.type = 'boolean'
      break

    case 'date':
      schema.type = 'string'
      schema.format = 'date-time'
      break

    case 'select':
      if (field.options && Array.isArray(field.options)) {
        schema.type = 'string'
        schema.enum = field.options.map(opt => 
          typeof opt === 'string' ? opt : opt.value || opt.label
        )
      } else {
        schema.type = 'string'
      }
      break

    case 'radio':
      if (field.options && Array.isArray(field.options)) {
        schema.type = 'string'
        schema.enum = field.options.map(opt => 
          typeof opt === 'string' ? opt : opt.value || opt.label
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

    case 'upload':
      schema.oneOf = [
        { type: 'string', description: 'File ID' },
        { type: 'object', description: 'File document' },
      ]
      break

    case 'richText':
    case 'json':
      schema.type = 'object'
      schema.additionalProperties = true
      break

    case 'array':
      schema.type = 'array'
      schema.items = { type: 'object', additionalProperties: true }
      break

    case 'blocks':
      schema.type = 'array'
      schema.items = { type: 'object', additionalProperties: true }
      break

    case 'group':
      schema.type = 'object'
      schema.additionalProperties = true
      break

    case 'point':
      schema.type = 'array'
      schema.items = { type: 'number' }
      schema.minItems = 2
      schema.maxItems = 2
      break

    default:
      // For unknown field types, allow any value
      schema.type = ['string', 'number', 'boolean', 'object', 'array', 'null']
      break
  }

  return schema
}