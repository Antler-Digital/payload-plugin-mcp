/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Access, CollectionConfig, CollectionSlug } from 'payload'
import type { GlobalConfig } from 'payload'

// JSONSchema7 type definition (since json-schema package doesn't have proper types)
export interface JSONSchema7 {
  [key: string]: any
  additionalProperties?: boolean | JSONSchema7
  default?: any
  description?: string
  enum?: any[]
  examples?: any[]
  format?: string
  items?: JSONSchema7
  maximum?: number
  maxItems?: number
  minimum?: number
  minItems?: number
  oneOf?: JSONSchema7[]
  properties?: Record<string, JSONSchema7>
  required?: string[]
  type?: string | string[]
}

export interface ToolDescriptor {
  collection: string
  description: string
  inputSchema: JSONSchema7
  name: string
  operation: ToolOperation
  outputSchema: JSONSchema7
}

export type ToolOperation = 'create' | 'delete' | 'get' | 'list' | 'update'

export interface ToolOperations {
  create?: boolean
  delete?: boolean
  get?: boolean
  list?: boolean
  update?: boolean
}

// Collection-specific configuration
export interface CollectionMcpOptions {
  /**
   * Custom description for this collection's tools
   */
  description?: string
  /**
   * Fields to exclude from schemas
   */
  excludeFields?: string[]
  /**
   * Additional metadata for this collection
   */
  metadata?: Record<string, any>
  /**
   * Operations to enable for this collection
   */
  operations?: ToolOperations
  /**
   * Custom tool naming prefix (defaults to collection slug)
   */
  toolPrefix?: string
}

// Collection configuration can be either:
// 1. Direct collection config
// 2. Object with collection and options
export type CollectionMcpConfig =
  | {
      collection: CollectionConfig
      options: CollectionMcpOptions
    }
  | CollectionConfig

// Global configuration can be either:
// 1. Direct global config
// 2. Object with global and options
export type GlobalMcpConfig =
  | {
      global: GlobalConfig
      options: CollectionMcpOptions
    }
  | GlobalConfig

// Collection field analysis (updated to include options)
export interface FieldAnalysis {
  arrayConstraints?: {
    maxItems?: number
    minItems?: number
  }
  arrayItemFields?: FieldAnalysis[]
  description?: string
  exampleValue?: any
  groupFields?: FieldAnalysis[]
  hasDefault: boolean
  name: string
  numberConstraints?: {
    integer?: boolean
    max?: number
    min?: number
  }
  options?: any[]
  relationship?: {
    hasMany?: boolean
    relationTo?: string | string[]
  }
  required: boolean
  // Optional constraint metadata for richer schemas
  stringConstraints?: {
    format?: string
    maxLength?: number
    minLength?: number
    pattern?: string
  }
  type: string
  uploadConstraints?: {
    maxFileSize?: number
    mimeTypes?: string[]
  }
  validation?: any
}

export interface CollectionAnalysis {
  fields: FieldAnalysis[]
  hasAuth: boolean
  hasUpload: boolean
  hasVersions?: boolean
  /** True when this analysis represents a GlobalConfig rather than a Collection */
  isGlobal?: boolean
  mcpOptions?: CollectionMcpOptions
  slug: 'all' | CollectionSlug
  timestamps: boolean
  /** Field name used as title in admin UI (from collection.admin.useAsTitle) */
  useAsTitle?: string
}

export type PayloadPluginMcpConfig = {
  /**
   * API key for authentication
   */
  apiKey: string
  /**
   * Collections to expose via MCP tools
   * Can be:
   * - 'all' to expose all collections with default operations
   * - Array of CollectionConfig (imported collections)
   * - Array of { collection: CollectionConfig, options: CollectionMcpOptions }
   */
  collections?: 'all' | CollectionMcpConfig[]
  /**
   * Default operations to enable for all collections
   */
  defaultOperations?: ToolOperations
  /**
   * Globals to expose via MCP tools
   * Can be:
   * - 'all' to expose all globals with default operations
   * - Array of GlobalConfig (imported globals)
   * - Array of { global: GlobalConfig, options: CollectionMcpOptions }
   */
  globals?: 'all' | GlobalMcpConfig[]

  /**
   * Media-specific configuration for MCP tools
   */
  media?: {
    /**
     * Enable chunked uploads for media. Defaults to false (disabled).
     */
    enableChunking?: boolean
  }

  /**
   * Rich text field configuration for MCP tools
   */
  richText?: {
    /**
     * Truncate rich text fields in list responses to this many characters.
     * Set to 0 or undefined to disable truncation.
     * Defaults to 200 characters.
     */
    truncateInList?: number
  }
  /**
   * Token storage configuration
   */
  tokens?: {
    /**
     * Optional access controls for the tokens collection installed by the plugin
     */
    access?: {
      admin?: Access
      create?: Access
      delete?: Access
      read?: Access
      update?: Access
    }
    /**
     * Admin interface configuration for the tokens collection
     */
    admin?: {
      /**
       * Default columns to show in the admin list view
       */
      defaultColumns?: string[]
      /**
       * Description for the collection
       */
      description?: string
      /**
       * Label to display in the admin panel
       */
      label?: string
    }
    /**
     * Collection slug to store tokens in. Defaults to 'mcp-tokens'.
     */
    slug?: string
  }
}
