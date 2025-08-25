import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { BasePayload, CollectionSlug } from 'payload'
import { z } from 'zod'

export const baseTools = (server: McpServer, payload: BasePayload) => {
  server.tool('get_collections', 'Get all collections from payload', {}, async () => {
    const collections = Object.keys(payload.collections)

    return {
      content: [{ type: 'text', text: `Collections: ${collections.join(', ')}` }], // TODO: return a list of collections
    }
  })

  /**
   * Get collection by name
   */
  server.tool(
    'get_collection_by_name',
    'Get collection by name',
    {
      name: z
        .enum(Object.keys(payload.collections) as [CollectionSlug, ...CollectionSlug[]])
        .describe('Name of the collection to get'),
    },
    async ({ name }) => {
      const collection = await payload.find({
        collection: name,
      })

      return {
        content: [{ type: 'text', text: `Collection: ${collection.docs.length} documents` }],
      }
    },
  )

  server.tool(
    'create_document',
    'Create new document in any collection',
    {
      collection: z
        .enum(Object.keys(payload.collections) as [CollectionSlug, ...CollectionSlug[]])
        .describe('Name of the collection to create document in'),
      data: z.record(z.any(), z.any()).describe('Document data to create'),
    },
    async ({ collection, data }) => {
      const doc = await payload.create({
        collection,
        data,
      })

      return {
        content: [{ type: 'text', text: `Created document with ID: ${doc.id}` }],
      }
    },
  )

  server.tool(
    'create_multiple_documents',
    'Create multiple documents in batch',
    {
      collection: z
        .enum(Object.keys(payload.collections) as [CollectionSlug, ...CollectionSlug[]])
        .describe('Name of the collection to create documents in'),
      data: z.array(z.record(z.any(), z.any())).describe('Array of document data to create'),
    },
    async ({ collection, data }) => {
      const docs = []
      for (const item of data) {
        const doc = await payload.create({
          collection,
          data: item,
        })
        docs.push(doc.id)
      }

      return {
        content: [
          { type: 'text', text: `Created ${docs.length} documents with IDs: ${docs.join(', ')}` },
        ],
      }
    },
  )

  server.tool(
    'update_document',
    'Update existing document by ID',
    {
      collection: z
        .enum(Object.keys(payload.collections) as [CollectionSlug, ...CollectionSlug[]])
        .describe('Name of the collection'),
      id: z.string().describe('Document ID to update'),
      data: z.record(z.any(), z.any()).describe('Document data to update'),
    },
    async ({ collection, id, data }) => {
      const doc = await payload.update({
        collection,
        id,
        data,
      })

      return {
        content: [{ type: 'text', text: `Updated document with ID: ${doc.id}` }],
      }
    },
  )

  server.tool(
    'delete_document',
    'Delete document by ID',
    {
      collection: z
        .enum(Object.keys(payload.collections) as [CollectionSlug, ...CollectionSlug[]])
        .describe('Name of the collection'),
      id: z.string().describe('Document ID to delete'),
    },
    async ({ collection, id }) => {
      await payload.delete({
        collection,
        id,
      })

      return {
        content: [{ type: 'text', text: `Deleted document with ID: ${id}` }],
      }
    },
  )

  server.tool(
    'find_documents',
    'Search/filter documents with query options',
    {
      collection: z
        .enum(Object.keys(payload.collections) as [CollectionSlug, ...CollectionSlug[]])
        .describe('Name of the collection'),
      where: z.record(z.any(), z.any()).optional().describe('Query conditions'),
      limit: z.number().optional().describe('Maximum number of documents to return'),
      page: z.number().optional().describe('Page number for pagination'),
      sort: z.string().optional().describe('Field to sort by'),
    },
    async ({ collection, where, limit, page, sort }) => {
      const result = await payload.find({
        collection,
        where,
        limit,
        page,
        sort,
      })

      return {
        content: [
          {
            type: 'text',
            text: `Found ${result.docs.length} documents (total: ${result.totalDocs})`,
          },
        ],
      }
    },
  )

  server.tool(
    'get_document_by_id',
    'Get single document by ID',
    {
      collection: z
        .enum(Object.keys(payload.collections) as [CollectionSlug, ...CollectionSlug[]])
        .describe('Name of the collection'),
      id: z.string().describe('Document ID to retrieve'),
    },
    async ({ collection, id }) => {
      const doc = await payload.findByID({
        collection,
        id,
      })

      return {
        content: [{ type: 'text', text: `Retrieved document with ID: ${doc.id}` }],
      }
    },
  )

  server.tool(
    'duplicate_document',
    'Clone existing document',
    {
      collection: z
        .enum(Object.keys(payload.collections) as [CollectionSlug, ...CollectionSlug[]])
        .describe('Name of the collection'),
      id: z.string().describe('Document ID to duplicate'),
      overrides: z
        .record(z.any(), z.any())
        .optional()
        .describe('Fields to override in the duplicate'),
    },
    async ({ collection, id, overrides = {} }) => {
      const originalDoc = await payload.findByID({
        collection,
        id,
      })

      const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...docData } = originalDoc

      const duplicateDoc = await payload.create({
        collection,
        data: {
          ...docData,
          ...overrides,
        },
      })

      return {
        content: [{ type: 'text', text: `Duplicated document. New ID: ${duplicateDoc.id}` }],
      }
    },
  )
}
