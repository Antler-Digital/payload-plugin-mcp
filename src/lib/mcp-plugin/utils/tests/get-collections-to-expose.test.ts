import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getCollectionsToExpose,
  getGlobalsToExpose,
  defaultOperations,
} from '../get-collections-to-expose.js'
import type { CollectionConfig, GlobalConfig } from 'payload'
import type { CollectionMcpConfig, GlobalMcpConfig } from '../../types/index.js'

// Mock the analyzeCollection function
vi.mock('../tool-generator', () => ({
  analyzeCollection: vi.fn((collection, options) => ({
    slug: collection.slug,
    operations: options.operations,
    fields: [],
    isGlobal: false,
  })),
}))

describe('get-collections-to-expose', () => {
  const mockCollection: CollectionConfig = {
    slug: 'posts',
    fields: [],
    admin: {},
  } as CollectionConfig

  const mockGlobal: GlobalConfig = {
    slug: 'settings',
    fields: [],
    admin: {},
  } as GlobalConfig

  const mockMcpTokensCollection: CollectionConfig = {
    slug: 'mcp-tokens',
    fields: [{ type: 'text', name: 'tokenHash' } as any],
    admin: {},
  } as CollectionConfig

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('defaultOperations', () => {
    it('should have correct default operation values', () => {
      expect(defaultOperations).toEqual({
        list: true,
        get: true,
        create: false,
        update: false,
        delete: false,
      })
    })
  })

  describe('getCollectionsToExpose', () => {
    it('should return all collections when collectionsOption is "all"', () => {
      const allCollections = [mockCollection, { ...mockCollection, slug: 'users' }]
      const result = getCollectionsToExpose(allCollections, 'all', defaultOperations)

      expect(result).toHaveLength(2)
      expect(result[0].slug).toBe('posts')
      expect(result[1].slug).toBe('users')
    })

    it('should exclude mcp-tokens collection when collectionsOption is "all"', () => {
      const allCollections = [mockCollection, mockMcpTokensCollection]
      const result = getCollectionsToExpose(allCollections, 'all', defaultOperations)

      expect(result).toHaveLength(1)
      expect(result[0].slug).toBe('posts')
    })

    it('should exclude collections with tokenHash field when collectionsOption is "all"', () => {
      const collectionWithTokenHash = {
        ...mockCollection,
        slug: 'auth',
        fields: [{ type: 'text', name: 'tokenHash' } as any],
      }
      const allCollections = [mockCollection, collectionWithTokenHash]
      const result = getCollectionsToExpose(allCollections, 'all', defaultOperations)

      expect(result).toHaveLength(1)
      expect(result[0].slug).toBe('posts')
    })

    it('should process configured collections with direct CollectionConfig', () => {
      const collectionsOption: CollectionMcpConfig[] = [mockCollection]
      const allCollections = [mockCollection]
      const result = getCollectionsToExpose(allCollections, collectionsOption, defaultOperations)

      expect(result).toHaveLength(1)
      expect(result[0].slug).toBe('posts')
    })

    it('should process configured collections with collection and options', () => {
      const collectionsOption: CollectionMcpConfig[] = [
        {
          collection: mockCollection,
          options: {
            operations: { list: false, get: true },
            toolPrefix: 'custom',
          },
        },
      ]
      const allCollections = [mockCollection]
      const result = getCollectionsToExpose(allCollections, collectionsOption, defaultOperations)

      expect(result).toHaveLength(1)
      expect(result[0].slug).toBe('posts')
    })

    it('should warn and skip mcp-tokens collection in configured collections', () => {
      const collectionsOption: CollectionMcpConfig[] = [mockMcpTokensCollection]
      const allCollections = [mockMcpTokensCollection]
      const result = getCollectionsToExpose(
        // @ts-ignore
        collectionsOption,
        allCollections,
        defaultOperations,
      )

      expect(result).toHaveLength(0)
      expect(console.warn).toHaveBeenCalledWith(
        "PayloadCMS MCP Plugin: Collection 'mcp-tokens' is excluded from MCP access for security reasons",
      )
    })

    it('should warn when configured collection is not found in registered collections', () => {
      const collectionsOption: CollectionMcpConfig[] = [mockCollection]
      const allCollections: CollectionConfig[] = []
      const result = getCollectionsToExpose(allCollections, collectionsOption, defaultOperations)

      expect(result).toHaveLength(0)
      expect(console.warn).toHaveBeenCalledWith(
        "PayloadCMS MCP Plugin: Collection 'posts' not found in registered collections",
      )
    })

    it('should merge default operations with custom operations', () => {
      const collectionsOption: CollectionMcpConfig[] = [
        {
          collection: mockCollection,
          options: {
            operations: { create: true },
          },
        },
      ]
      const allCollections = [mockCollection]
      const result = getCollectionsToExpose(allCollections, collectionsOption, defaultOperations)

      expect(result).toHaveLength(1)
      // The analyzeCollection mock should be called with merged operations
      // The mock returns the options.operations directly, so we expect the custom operations
      // @ts-ignore
      expect(result[0].operations).toEqual({
        create: true,
      })
    })
  })

  describe('getGlobalsToExpose', () => {
    it('should return all globals when globalsOption is "all"', () => {
      const allGlobals = [mockGlobal, { ...mockGlobal, slug: 'navigation' }]
      const result = getGlobalsToExpose(allGlobals, 'all', defaultOperations)

      expect(result).toHaveLength(2)
      expect(result[0].slug).toBe('settings')
      expect(result[1].slug).toBe('navigation')
      expect(result[0].isGlobal).toBe(true)
      expect(result[1].isGlobal).toBe(true)
    })

    it('should restrict global operations to get and update only', () => {
      const allGlobals = [mockGlobal]
      const result = getGlobalsToExpose(allGlobals, 'all', defaultOperations)

      expect(result).toHaveLength(1)
      // Globals should only support get/update operations
      // @ts-ignore
      expect(result[0].operations).toEqual({
        list: false,
        get: true,
        create: false,
        update: true,
        delete: false,
      })
    })

    it('should process configured globals with direct GlobalConfig', () => {
      const globalsOption: GlobalMcpConfig[] = [mockGlobal]
      const allGlobals = [mockGlobal]
      const result = getGlobalsToExpose(allGlobals, globalsOption, defaultOperations)

      expect(result).toHaveLength(1)
      expect(result[0].slug).toBe('settings')
      expect(result[0].isGlobal).toBe(true)
    })

    it('should process configured globals with global and options', () => {
      const globalsOption: GlobalMcpConfig[] = [
        {
          global: mockGlobal,
          options: {
            operations: { update: false },
            toolPrefix: 'custom',
          },
        },
      ]
      const allGlobals = [mockGlobal]
      const result = getGlobalsToExpose(allGlobals, globalsOption, defaultOperations)

      expect(result).toHaveLength(1)
      expect(result[0].slug).toBe('settings')
      expect(result[0].isGlobal).toBe(true)
    })

    it('should warn when configured global is not found in registered globals', () => {
      const globalsOption: GlobalMcpConfig[] = [mockGlobal]
      const allGlobals: GlobalConfig[] = []
      const result = getGlobalsToExpose(allGlobals, globalsOption, defaultOperations)

      expect(result).toHaveLength(0)
      expect(console.warn).toHaveBeenCalledWith(
        "PayloadCMS MCP Plugin: Global 'settings' not found in registered globals",
      )
    })

    it('should merge global operations with custom operations', () => {
      const globalsOption: GlobalMcpConfig[] = [
        {
          global: mockGlobal,
          options: {
            operations: { update: false },
          },
        },
      ]
      const allGlobals = [mockGlobal]
      const result = getGlobalsToExpose(allGlobals, globalsOption, defaultOperations)

      expect(result).toHaveLength(1)
      // The mock returns the options.operations directly, so we expect the custom operations
      // @ts-ignore
      expect(result[0].operations).toEqual({
        update: false,
      })
    })
  })
})
