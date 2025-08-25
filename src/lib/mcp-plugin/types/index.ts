/* eslint-disable @typescript-eslint/no-explicit-any */
import type { CollectionConfig, CollectionSlug, Access } from 'payload'
import type { GlobalConfig } from 'payload'

// JSONSchema7 type definition (since json-schema package doesn't have proper types)
export interface JSONSchema7 {
  type?: string | string[]
  properties?: Record<string, JSONSchema7>
  items?: JSONSchema7
  required?: string[]
  enum?: any[]
  oneOf?: JSONSchema7[]
  description?: string
  format?: string
  minimum?: number
  maximum?: number
  minItems?: number
  maxItems?: number
  default?: any
  examples?: any[]
  additionalProperties?: boolean | JSONSchema7
  [key: string]: any
}

export interface ToolDescriptor {
  name: string
  description: string
  inputSchema: JSONSchema7
  outputSchema: JSONSchema7
  collection: string
  operation: ToolOperation
}

export type ToolOperation = 'list' | 'get' | 'create' | 'update' | 'delete'

export interface ToolOperations {
  list?: boolean
  get?: boolean
  create?: boolean
  update?: boolean
  delete?: boolean
}

// Collection-specific configuration
export interface CollectionMcpOptions {
  /**
   * Operations to enable for this collection
   */
  operations?: ToolOperations
  /**
   * Custom tool naming prefix (defaults to collection slug)
   */
  toolPrefix?: string
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
}

// Collection configuration can be either:
// 1. Direct collection config
// 2. Object with collection and options
export type CollectionMcpConfig =
  | CollectionConfig
  | {
      collection: CollectionConfig
      options: CollectionMcpOptions
    }

// Global configuration can be either:
// 1. Direct global config
// 2. Object with global and options
export type GlobalMcpConfig =
  | GlobalConfig
  | {
      global: GlobalConfig
      options: CollectionMcpOptions
    }

// Collection field analysis (updated to include options)
export interface FieldAnalysis {
  name: string
  type: string
  required: boolean
  hasDefault: boolean
  description?: string
  options?: any[]
  validation?: any
  // Optional constraint metadata for richer schemas
  stringConstraints?: {
    minLength?: number
    maxLength?: number
    pattern?: string
    format?: string
  }
  numberConstraints?: {
    min?: number
    max?: number
    integer?: boolean
  }
  arrayConstraints?: {
    minItems?: number
    maxItems?: number
  }
  relationship?: {
    relationTo?: string | string[]
    hasMany?: boolean
  }
  uploadConstraints?: {
    mimeTypes?: string[]
    maxFileSize?: number
  }
}

export interface CollectionAnalysis {
  slug: CollectionSlug | 'all'
  fields: FieldAnalysis[]
  hasUpload: boolean
  hasAuth: boolean
  timestamps: boolean
  mcpOptions?: CollectionMcpOptions
  /** True when this analysis represents a GlobalConfig rather than a Collection */
  isGlobal?: boolean
}

export type PayloadPluginMcpConfig = {
  /**
   * Collections to expose via MCP tools
   * Can be:
   * - 'all' to expose all collections with default operations
   * - Array of CollectionConfig (imported collections)
   * - Array of { collection: CollectionConfig, options: CollectionMcpOptions }
   */
  collections?: CollectionMcpConfig[] | 'all'
  /**
   * Globals to expose via MCP tools
   * Can be:
   * - 'all' to expose all globals with default operations
   * - Array of GlobalConfig (imported globals)
   * - Array of { global: GlobalConfig, options: CollectionMcpOptions }
   */
  globals?: GlobalMcpConfig[] | 'all'
  /**
   * API key for authentication
   */
  apiKey: string
  /**
   * Default operations to enable for all collections
   */
  defaultOperations?: ToolOperations

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
     * Collection slug to store tokens in. Defaults to 'mcp-tokens'.
     */
    slug?: string
    /**
     * Admin interface configuration for the tokens collection
     */
    admin?: {
      /**
       * Label to display in the admin panel
       */
      label?: string
      /**
       * Description for the collection
       */
      description?: string
      /**
       * Default columns to show in the admin list view
       */
      defaultColumns?: string[]
    }
    /**
     * Optional access controls for the tokens collection installed by the plugin
     */
    access?: {
      read?: Access
      create?: Access
      update?: Access
      delete?: Access
      admin?: Access
    }
  }
}
