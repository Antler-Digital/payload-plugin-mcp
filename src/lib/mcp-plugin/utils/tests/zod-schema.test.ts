import { describe, expect, it, vi } from 'vitest'
import { z } from 'zod'

import type { CollectionAnalysis, FieldAnalysis } from '../../types/index.js'

import { buildInputZodShape } from '../zod-schema.js'

describe('zod-schema', () => {
  const mockCollectionAnalysis: CollectionAnalysis = {
    slug: 'posts',
    // @ts-ignore
    fields: [
      {
        name: 'title',
        type: 'text',
        hasDefault: false,
        required: true,
      } as FieldAnalysis,
      {
        name: 'content',
        type: 'richText',
        hasDefault: false,
        required: false,
      } as FieldAnalysis,
      {
        name: 'author',
        type: 'relationship',
        hasDefault: false,
        required: true,
      } as FieldAnalysis,
    ],
    isGlobal: false,
    // @ts-expect-error - operations is added by the plugin
    operations: { create: true, delete: true, get: true, list: true, update: true },
  }

  const mockGlobalAnalysis: CollectionAnalysis = {
    ...mockCollectionAnalysis,
    slug: 'settings',
    isGlobal: true,
  }

  describe('buildInputZodShape', () => {
    describe('list operation', () => {
      it('should return empty object for global collections', () => {
        const result = buildInputZodShape(mockGlobalAnalysis, 'list')
        expect(result).toEqual({})
      })

      it('should return pagination and filtering options for regular collections', () => {
        const result = buildInputZodShape(mockCollectionAnalysis, 'list')

        expect(result).toHaveProperty('where')
        expect(result).toHaveProperty('limit')
        expect(result).toHaveProperty('page')
        expect(result).toHaveProperty('sort')
        expect(result).toHaveProperty('depth')

        // Check that the properties exist and are Zod schemas
        expect(result.limit).toBeDefined()
        expect(result.page).toBeDefined()
        expect(result.depth).toBeDefined()
      })

      it('should parse string where JSON into object via preprocess', () => {
        const shape = buildInputZodShape(mockCollectionAnalysis, 'list')
        // Zod schema shape object: use z.object to validate
        const schema = (z as any).object(shape)
        const parsed = schema.parse({ where: '{"title": {"equals": "Hello"}}' })
        expect(parsed.where).toEqual({ title: { equals: 'Hello' } })
      })
    })

    describe('get operation', () => {
      it('should return only depth for global collections', () => {
        const result = buildInputZodShape(mockGlobalAnalysis, 'get')
        expect(result).toHaveProperty('depth')
        expect(result).not.toHaveProperty('id')
      })

      it('should return id and depth for regular collections', () => {
        const result = buildInputZodShape(mockCollectionAnalysis, 'get')
        expect(result).toHaveProperty('id')
        expect(result).toHaveProperty('depth')
        expect(result.id?.description).toContain('ID of the document')
      })
    })

    describe('create operation', () => {
      it('should return empty object for global collections', () => {
        const result = buildInputZodShape(mockGlobalAnalysis, 'create')
        expect(result).toEqual({})
      })

      it('should return data and depth for regular collections', () => {
        const result = buildInputZodShape(mockCollectionAnalysis, 'create')
        expect(result).toHaveProperty('data')
        expect(result).toHaveProperty('depth')
        expect(result.data?.description).toContain('Document data to create')
      })
    })

    describe('update operation', () => {
      it('should return id, data and depth for global collections', () => {
        const result = buildInputZodShape(mockGlobalAnalysis, 'update')
        expect(result).toHaveProperty('data')
        expect(result).toHaveProperty('depth')
        expect(result).not.toHaveProperty('id')
      })

      it('should return id, data and depth for regular collections', () => {
        const result = buildInputZodShape(mockCollectionAnalysis, 'update')
        expect(result).toHaveProperty('id')
        expect(result).toHaveProperty('data')
        expect(result).toHaveProperty('depth')
        expect(result.id?.description).toContain('ID of the document')
        expect(result.data?.description).toContain('Document data to update')
      })
    })

    describe('delete operation', () => {
      it('should return empty object for global collections', () => {
        const result = buildInputZodShape(mockGlobalAnalysis, 'delete')
        expect(result).toEqual({})
      })

      it('should return only id for regular collections', () => {
        const result = buildInputZodShape(mockCollectionAnalysis, 'delete')
        expect(result).toHaveProperty('id')
        expect(result.id?.description).toContain('ID of the document')
      })
    })
  })

  // Note: buildDataZodObjectShape is not exported, so we can't test it directly
  // This function is used internally by buildInputZodShape
  describe('buildDataZodObjectShape (internal function)', () => {
    it('should be used internally by buildInputZodShape for create operations', () => {
      // Test that the create operation returns a data field that uses the internal function
      const result = buildInputZodShape(mockCollectionAnalysis, 'create')
      expect(result).toHaveProperty('data')
      expect(result.data?.description).toContain('Document data to create')
    })
  })
})
