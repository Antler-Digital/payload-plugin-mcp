/* eslint-disable @typescript-eslint/no-explicit-any */
import type { CollectionAnalysis, FieldAnalysis } from '../types/index.js'

/**
 * Format a collection analysis into a clear, structured description
 * that's easy for LLMs to understand and use
 */
export function formatCollectionDescription(analysis: CollectionAnalysis): string {
  const sections: string[] = []

  // Header
  sections.push(`# Collection: ${analysis.slug}`)
  sections.push('')
  sections.push(`**Type:** ${analysis.isGlobal ? 'Global' : 'Collection'}`)
  sections.push(`**Has Upload:** ${analysis.hasUpload}`)
  sections.push(`**Has Auth:** ${analysis.hasAuth}`)
  sections.push(`**Timestamps:** ${analysis.timestamps}`)
  sections.push('')

  // Operations
  if (analysis.mcpOptions?.operations) {
    sections.push('## Enabled Operations')
    sections.push('')
    const ops = analysis.mcpOptions.operations
    sections.push(`- List: ${ops.list !== false}`)
    sections.push(`- Get: ${ops.get !== false}`)
    sections.push(`- Create: ${ops.create === true}`)
    sections.push(`- Update: ${ops.update === true}`)
    sections.push(`- Delete: ${ops.delete === true}`)
    sections.push('')
  }

  // Fields
  sections.push('## Fields')
  sections.push('')

  if (analysis.fields.length === 0) {
    sections.push('_No fields defined_')
  } else {
    for (const field of analysis.fields) {
      sections.push(formatField(field, 0))
      sections.push('')
    }
  }

  // Example document structure
  sections.push('## Example Document Structure')
  sections.push('')
  sections.push('```json')
  sections.push(JSON.stringify(generateExampleDocument(analysis), null, 2))
  sections.push('```')
  sections.push('')

  // Notes for creating/updating
  sections.push('## Important Notes')
  sections.push('')
  sections.push('### For Arrays:')
  sections.push('- Arrays should be passed as JSON arrays with objects matching the item structure')
  sections.push('- Each array item must include all required fields')
  sections.push('- See the "Array Item Fields" section for each array field above')
  sections.push('')
  sections.push('### For Groups:')
  sections.push(
    '- Groups should be passed as JSON objects with fields matching the group structure',
  )
  sections.push('- See the "Group Fields" section for each group field above')
  sections.push('')
  sections.push('### For Relationships:')
  sections.push('- Can be passed as a document ID (string)')
  sections.push('- For hasMany relationships, pass an array of IDs')
  sections.push(
    '- When reading, may be populated with full document or just ID depending on depth parameter',
  )
  sections.push('')
  sections.push('### For Rich Text:')
  sections.push('- Rich text fields accept Markdown strings for create/update operations')
  sections.push('- The system automatically converts Markdown to Lexical JSON format')
  sections.push(
    '- When reading via LIST operations, rich text is converted to Markdown and **truncated to 200 characters**',
  )
  sections.push('- When reading via GET operations, rich text is returned in full (not truncated)')
  sections.push(
    '- To see full rich text content, use the get operation instead of list, or request specific fields',
  )
  sections.push('')

  return sections.join('\n')
}

/**
 * Format a single field with proper indentation and nested structures
 */
function formatField(field: FieldAnalysis, indentLevel: number): string {
  const indent = '  '.repeat(indentLevel)
  const sections: string[] = []

  // Field header
  let header = `${indent}### ${field.name}`
  if (field.required) {
    header += ' **(required)**'
  }
  sections.push(header)
  sections.push('')

  // Basic info
  sections.push(`${indent}- **Type:** \`${field.type}\``)
  if (field.description) {
    sections.push(`${indent}- **Description:** ${field.description}`)
  }
  if (field.hasDefault) {
    sections.push(`${indent}- **Has Default Value:** Yes`)
  }

  // Type-specific constraints
  if (field.stringConstraints) {
    sections.push(`${indent}- **String Constraints:**`)
    if (field.stringConstraints.minLength)
      {sections.push(`${indent}  - Min Length: ${field.stringConstraints.minLength}`)}
    if (field.stringConstraints.maxLength)
      {sections.push(`${indent}  - Max Length: ${field.stringConstraints.maxLength}`)}
    if (field.stringConstraints.pattern)
      {sections.push(`${indent}  - Pattern: \`${field.stringConstraints.pattern}\``)}
    if (field.stringConstraints.format)
      {sections.push(`${indent}  - Format: ${field.stringConstraints.format}`)}
  }

  if (field.numberConstraints) {
    sections.push(`${indent}- **Number Constraints:**`)
    if (field.numberConstraints.min !== undefined)
      {sections.push(`${indent}  - Min: ${field.numberConstraints.min}`)}
    if (field.numberConstraints.max !== undefined)
      {sections.push(`${indent}  - Max: ${field.numberConstraints.max}`)}
    if (field.numberConstraints.integer !== undefined)
      {sections.push(`${indent}  - Integer Only: ${field.numberConstraints.integer}`)}
  }

  if (field.arrayConstraints) {
    sections.push(`${indent}- **Array Constraints:**`)
    if (field.arrayConstraints.minItems !== undefined)
      {sections.push(`${indent}  - Min Items: ${field.arrayConstraints.minItems}`)}
    if (field.arrayConstraints.maxItems !== undefined)
      {sections.push(`${indent}  - Max Items: ${field.arrayConstraints.maxItems}`)}
  }

  // Options for select/radio
  if (field.options && Array.isArray(field.options) && field.options.length > 0) {
    sections.push(`${indent}- **Options:**`)
    for (const option of field.options) {
      const optionValue = typeof option === 'string' ? option : option.value || option.label
      const optionLabel = typeof option === 'string' ? option : option.label || option.value
      sections.push(
        `${indent}  - \`${optionValue}\`${optionLabel !== optionValue ? ` (${optionLabel})` : ''}`,
      )
    }
  }

  // Relationship info
  if (field.relationship) {
    sections.push(`${indent}- **Relationship:**`)
    const relationTo = Array.isArray(field.relationship.relationTo)
      ? field.relationship.relationTo.join(', ')
      : field.relationship.relationTo
    sections.push(`${indent}  - Related To: ${relationTo}`)
    sections.push(`${indent}  - Has Many: ${field.relationship.hasMany}`)
  }

  // Upload constraints
  if (field.uploadConstraints) {
    sections.push(`${indent}- **Upload Constraints:**`)
    if (field.uploadConstraints.mimeTypes)
      {sections.push(`${indent}  - MIME Types: ${field.uploadConstraints.mimeTypes.join(', ')}`)}
    if (field.uploadConstraints.maxFileSize)
      {sections.push(`${indent}  - Max File Size: ${field.uploadConstraints.maxFileSize} bytes`)}
  }

  // Example value
  if (field.exampleValue !== undefined) {
    sections.push(`${indent}- **Example Value:**`)
    sections.push(`${indent}  \`\`\`json`)
    sections.push(
      `${indent}  ${JSON.stringify(field.exampleValue, null, 2).split('\n').join(`\n${indent}  `)}`,
    )
    sections.push(`${indent}  \`\`\``)
  }

  // Array item fields (nested structure)
  if (field.arrayItemFields && field.arrayItemFields.length > 0) {
    sections.push('')
    sections.push(`${indent}#### Array Item Fields:`)
    sections.push('')
    sections.push(
      `${indent}_Each item in the \`${field.name}\` array should be an object with the following fields:_`,
    )
    sections.push('')
    for (const itemField of field.arrayItemFields) {
      sections.push(formatField(itemField, indentLevel + 1))
    }
  }

  // Group fields (nested structure)
  if (field.groupFields && field.groupFields.length > 0) {
    sections.push('')
    sections.push(`${indent}#### Group Fields:`)
    sections.push('')
    sections.push(`${indent}_The \`${field.name}\` group contains the following nested fields:_`)
    sections.push('')
    for (const groupField of field.groupFields) {
      sections.push(formatField(groupField, indentLevel + 1))
    }
  }

  return sections.join('\n')
}

/**
 * Generate an example document structure based on the collection analysis
 */
function generateExampleDocument(analysis: CollectionAnalysis): any {
  const doc: Record<string, any> = {}

  // Add ID for collections
  if (!analysis.isGlobal) {
    doc.id = 'document_id_123'
  }

  // Add fields
  for (const field of analysis.fields) {
    if (field.exampleValue !== undefined) {
      doc[field.name] = field.exampleValue
    }
  }

  // Add timestamps
  if (analysis.timestamps) {
    doc.createdAt = '2024-01-01T00:00:00.000Z'
    doc.updatedAt = '2024-01-01T00:00:00.000Z'
  }

  return doc
}
