/* eslint-disable @typescript-eslint/no-explicit-any */
import { z, type ZodRawShape } from 'zod'
import type { CollectionAnalysis, FieldAnalysis, ToolOperation } from '../types/index.js'

/**
 * Build Zod parameter shape for a given operation, based on analyzed collection schema.
 * Returns a ZodRawShape that can be passed to McpServer.tool/registerTool.
 */
export function buildInputZodShape(
  analysis: CollectionAnalysis,
  operation: ToolOperation,
): ZodRawShape {
  switch (operation) {
    case 'list':
      if (analysis.isGlobal) return {}
      return {
        where: z.any().describe('Query conditions for filtering documents').optional(),
        limit: z
          .number()
          .int()
          .min(1)
          .max(100)
          .default(10)
          .describe('Maximum number of documents to return')
          .optional(),
        page: z
          .number()
          .int()
          .min(1)
          .default(1)
          .describe('Page number for pagination (1-based)')
          .optional(),
        sort: z.string().describe('Sort field name (prefix with - for descending)').optional(),
        depth: z
          .number()
          .int()
          .min(0)
          .max(10)
          .default(1)
          .describe('Depth of population for relationships')
          .optional(),
      }

    case 'get':
      return {
        ...(analysis.isGlobal
          ? {}
          : { id: z.string().describe('The ID of the document to retrieve') }),
        depth: z
          .number()
          .int()
          .min(0)
          .max(10)
          .default(1)
          .describe('Depth of population for relationships')
          .optional(),
      }

    case 'create':
      if (analysis.isGlobal) return {}
      return {
        data: z
          .preprocess(
            (val) => {
              if (typeof val === 'string') {
                try {
                  return JSON.parse(val)
                } catch {
                  return val
                }
              }
              return val
            },
            // Keep unknown keys (e.g., password added by auth collections)
            z.object(buildDataZodObjectShape(analysis, /*allFieldsRequired*/ true)).passthrough(),
          )
          .describe('Document data to create (object or JSON string)'),
        depth: z
          .number()
          .int()
          .min(0)
          .max(10)
          .default(1)
          .describe('Depth of population for relationships in response')
          .optional(),
      }

    case 'update':
      return {
        ...(analysis.isGlobal
          ? {}
          : { id: z.string().describe('The ID of the document to update') }),
        data: z
          .preprocess(
            (val) => {
              if (typeof val === 'string') {
                try {
                  return JSON.parse(val)
                } catch {
                  return val
                }
              }
              return val
            },
            // Keep unknown keys to avoid stripping fields like password
            z.object(buildDataZodObjectShape(analysis, /*allFieldsRequired*/ false)).passthrough(),
          )
          .describe('Document data to update (object or JSON string)'),
        depth: z
          .number()
          .int()
          .min(0)
          .max(10)
          .default(1)
          .describe('Depth of population for relationships in response')
          .optional(),
      }

    case 'delete':
      if (analysis.isGlobal) return {}
      return {
        id: z.string().describe('The ID of the document to delete'),
      }

    default:
      return {}
  }
}

/**
 * Builds a ZodRawShape for the `data` object used in create/update operations.
 * For deeply nested Payload fields, we currently allow any nested object for safety,
 * while preserving primitive types based on field analysis where possible.
 */
function buildDataZodObjectShape(
  analysis: CollectionAnalysis,
  allFieldsRequired: boolean,
): ZodRawShape {
  // can't use ZodRawShape for type as its readonly
  const shape: Record<string, any> = {}

  for (const field of analysis.fields) {
    if (field.name === 'id' || field.name === 'createdAt' || field.name === 'updatedAt') {
      continue
    }

    const zodType = fieldAnalysisToZod(field)

    // Optionality: required when creating and field.required with no default
    if (allFieldsRequired && field.required && !field.hasDefault) {
      shape[field.name] = zodType
    } else {
      shape[field.name] = zodType.optional()
    }
  }

  // Include auth password when collection has auth enabled
  if (analysis.hasAuth) {
    // Basic constraints; Payload will enforce additional auth rules
    const passwordSchema = z
      .string()
      .min(8, 'Password must be at least 8 characters long')
      .describe('Password for authenticated user collections')
    shape.password = allFieldsRequired ? passwordSchema : passwordSchema.optional()
  }

  return shape
}

/**
 * Maps a FieldAnalysis to a Zod type. Complex/nested types become broad shapes
 * to avoid over-constraining.
 */
function fieldAnalysisToZod(field: FieldAnalysis) {
  switch (field.type) {
    case 'text':
    case 'textarea':
    case 'code':
    case 'email': {
      let s = z.string()
      if (field.stringConstraints) {
        const { minLength, maxLength, pattern } = field.stringConstraints
        if (typeof minLength === 'number') s = s.min(minLength)
        if (typeof maxLength === 'number') s = s.max(maxLength)
        if (pattern) {
          try {
            s = s.regex(new RegExp(pattern))
          } catch {
            // ignore invalid regex
          }
        }
      }
      return field.description ? s.describe(field.description) : s
    }
    case 'number': {
      let n = z.number()
      if (field.numberConstraints) {
        const { min, max, integer } = field.numberConstraints
        if (typeof min === 'number') n = n.min(min)
        if (typeof max === 'number') n = n.max(max)
        if (integer) n = n.int()
      }
      return field.description ? n.describe(field.description) : n
    }
    case 'checkbox':
      return field.description ? z.boolean().describe(field.description) : z.boolean()
    case 'date':
      return z.string().describe(field.description ?? 'ISO date-time string')
    case 'select':
    case 'radio':
      if (field.options && Array.isArray(field.options) && field.options.length > 0) {
        const values = field.options.map((opt: any) =>
          typeof opt === 'string' ? opt : opt.value || opt.label,
        )
        const enumSchema = z.enum(values as [string, ...string[]])
        return field.description ? enumSchema.describe(field.description) : enumSchema
      }
      return field.description ? z.string().describe(field.description) : z.string()
    case 'relationship':
      return z
        .union([z.string(), z.record(z.string(), z.any())])
        .describe(field.description ?? 'Document ID or populated document')
    case 'upload':
      return z
        .union([z.string(), z.record(z.string(), z.any())])
        .describe(field.description ?? 'File ID or file document')
    case 'richText':
      return z
        .string()
        .describe(
          field.description ??
            'Rich text content (Markdown string). Example: "# Heading\\n\\nSome **bold** text"',
        )
    case 'json':
      return z.record(z.string(), z.any()).describe(field.description ?? 'Arbitrary JSON object')
    case 'array':
    case 'blocks': {
      let a = z.array(z.record(z.string(), z.any()))
      if (field.arrayConstraints) {
        const { minItems, maxItems } = field.arrayConstraints
        if (typeof minItems === 'number') a = a.min(minItems)
        if (typeof maxItems === 'number') a = a.max(maxItems)
      }
      return a.describe(field.description ?? 'Array of objects')
    }
    case 'group':
      return z.record(z.string(), z.any()).describe(field.description ?? 'Object')
    case 'point':
      return z
        .tuple([z.number(), z.number()])
        .describe(field.description ?? 'Tuple [longitude, latitude]')
    default:
      return z.any().describe(field.description ?? 'Any')
  }
}
