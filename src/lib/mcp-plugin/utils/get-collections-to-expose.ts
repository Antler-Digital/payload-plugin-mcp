/* eslint-disable @typescript-eslint/no-explicit-any */
import type { CollectionConfig, GlobalConfig } from 'payload'
import { analyzeCollection } from './tool-generator.js'
import type {
  CollectionMcpConfig,
  ToolOperations,
  CollectionAnalysis,
  GlobalMcpConfig,
} from '../types/index.js'

export const defaultOperations: ToolOperations = {
  list: true,
  get: true,
  create: false,
  update: false,
  delete: false,
}

export function getCollectionsToExpose(
  allCollections: CollectionConfig[],
  collectionsOption: CollectionMcpConfig[] | 'all',
  defaultOperations: ToolOperations,
): CollectionAnalysis[] {
  if (collectionsOption === 'all') {
    // Return all collections with default operations, properly analyzed
    // Exclude mcp-tokens collection for security reasons
    return allCollections
      .filter(
        (collection) =>
          collection.slug !== 'mcp-tokens' &&
          !collection.fields.some((field) => field.type === 'text' && field.name === 'tokenHash'),
      )
      .map((collection) =>
        analyzeCollection(collection, {
          operations: defaultOperations,
        }),
      )
  }

  // Process configured collections
  const result: CollectionAnalysis[] = []

  for (const configItem of collectionsOption) {
    let collection: CollectionConfig
    let mcpOptions: any = {}

    if ('collection' in configItem && 'options' in configItem) {
      // { collection: CollectionConfig, options: CollectionMcpOptions }
      collection = configItem.collection
      mcpOptions = {
        operations: { ...defaultOperations, ...configItem.options.operations },
        ...configItem.options,
      }
    } else {
      // Direct CollectionConfig
      collection = configItem as CollectionConfig
      mcpOptions = {
        operations: defaultOperations,
      }
    }

    // Skip mcp-tokens collection for security reasons
    if (collection.slug === 'mcp-tokens') {
      console.warn(
        `PayloadCMS MCP Plugin: Collection 'mcp-tokens' is excluded from MCP access for security reasons`,
      )
      continue
    }

    // Find the collection in allCollections to ensure it's registered
    const registeredCollection = allCollections.find((c) => c.slug === collection.slug)
    if (registeredCollection) {
      // Use the registered collection for analysis to ensure we have the complete config
      result.push(analyzeCollection(registeredCollection, mcpOptions))
    } else {
      console.warn(
        `PayloadCMS MCP Plugin: Collection '${collection.slug}' not found in registered collections`,
      )
    }
  }

  return result
}

export function getGlobalsToExpose(
  allGlobals: GlobalConfig[],
  globalsOption: GlobalMcpConfig[] | 'all',
  defaultOperations: ToolOperations,
): CollectionAnalysis[] {
  // Globals only support get/update operations
  const globalOps = {
    ...defaultOperations,
    list: false,
    create: false,
    delete: false,
    get: true,
    update: true,
  }

  if (globalsOption === 'all') {
    return allGlobals.map((global) => {
      const analysis = analyzeCollection(global as unknown as CollectionConfig, {
        operations: globalOps,
      })
      analysis.isGlobal = true
      return analysis
    })
  }

  const result: CollectionAnalysis[] = []
  for (const configItem of globalsOption) {
    let global: GlobalConfig
    let mcpOptions: any = {}

    if ('global' in configItem && 'options' in configItem) {
      global = configItem.global
      mcpOptions = {
        operations: { ...globalOps, ...configItem.options.operations },
        ...configItem.options,
      }
    } else {
      global = configItem as GlobalConfig
      mcpOptions = {
        operations: globalOps,
      }
    }

    const registeredGlobal = allGlobals.find((g) => g.slug === global.slug)
    if (registeredGlobal) {
      const analysis = analyzeCollection(
        registeredGlobal as unknown as CollectionConfig,
        mcpOptions,
      )
      analysis.isGlobal = true
      result.push(analysis)
    } else {
      console.warn(`PayloadCMS MCP Plugin: Global '${global.slug}' not found in registered globals`)
    }
  }
  return result
}
