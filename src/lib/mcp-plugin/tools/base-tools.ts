import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { BasePayload, CollectionSlug } from 'payload'

import { z } from 'zod'

export const baseTools = (server: McpServer, payload: BasePayload) => {
  server.tool('get_collections', 'Get all collections from payload', {}, async () => {
    const collections = Object.keys(payload.collections)

    return {
      content: [{ type: 'text', text: `Collections: ${collections.join(', ')}` }],
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
        draft: true,
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
        draft: true,
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
          draft: true,
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
      id: z.string().describe('Document ID to update'),
      collection: z
        .enum(Object.keys(payload.collections) as [CollectionSlug, ...CollectionSlug[]])
        .describe('Name of the collection'),
      data: z.record(z.any(), z.any()).describe('Document data to update'),
    },
    async ({ id, collection, data }) => {
      const doc = await payload.update({
        id,
        collection,
        data,
        draft: true,
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
      id: z.string().describe('Document ID to delete'),
      collection: z
        .enum(Object.keys(payload.collections) as [CollectionSlug, ...CollectionSlug[]])
        .describe('Name of the collection'),
    },
    async ({ id, collection }) => {
      await payload.delete({
        id,
        collection,
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
      limit: z.number().optional().describe('Maximum number of documents to return'),
      page: z.number().optional().describe('Page number for pagination'),
      sort: z.string().optional().describe('Field to sort by'),
      where: z.record(z.any(), z.any()).optional().describe('Query conditions'),
    },
    async ({ collection, limit, page, sort, where }) => {
      const result = await payload.find({
        collection,
        limit,
        page,
        sort,
        where,
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
      id: z.string().describe('Document ID to retrieve'),
      collection: z
        .enum(Object.keys(payload.collections) as [CollectionSlug, ...CollectionSlug[]])
        .describe('Name of the collection'),
    },
    async ({ id, collection }) => {
      const doc = await payload.findByID({
        id,
        collection,
        draft: true,
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
      id: z.string().describe('Document ID to duplicate'),
      collection: z
        .enum(Object.keys(payload.collections) as [CollectionSlug, ...CollectionSlug[]])
        .describe('Name of the collection'),
      overrides: z
        .record(z.any(), z.any())
        .optional()
        .describe('Fields to override in the duplicate'),
    },
    async ({ id, collection, overrides = {} }) => {
      const originalDoc = await payload.findByID({
        id,
        collection,
        draft: true,
      })

      const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...docData } = originalDoc

      const duplicateDoc = await payload.create({
        collection,
        data: {
          ...docData,
          ...overrides,
        },
        draft: true,
      })

      return {
        content: [{ type: 'text', text: `Duplicated document. New ID: ${duplicateDoc.id}` }],
      }
    },
  )
}
