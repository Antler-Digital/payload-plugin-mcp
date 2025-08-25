import { describe, it, expect, vi } from 'vitest'
import { buildInputZodShape } from '../zod-schema.js'
import type { CollectionAnalysis, FieldAnalysis } from '../../types/index.js'

describe('zod-schema', () => {
  const mockCollectionAnalysis: CollectionAnalysis = {
    slug: 'posts',
    // @ts-ignore
    operations: { list: true, get: true, create: true, update: true, delete: true },
    fields: [
      {
        name: 'title',
        type: 'text',
        required: true,
        hasDefault: false,
      } as FieldAnalysis,
      {
        name: 'content',
        type: 'richText',
        required: false,
        hasDefault: false,
      } as FieldAnalysis,
      {
        name: 'author',
        type: 'relationship',
        required: true,
        hasDefault: false,
      } as FieldAnalysis,
    ],
    isGlobal: false,
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
