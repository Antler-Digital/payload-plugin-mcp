import type { CollectionConfig, Field } from 'payload'

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

export interface AuthConfig {
  apiKey: string
}

export interface McpServerConfig {
  apiKey: string
  enableStdio: boolean
  host: string
  port: number
  serverDescription: string
  serverName: string
  toolDescriptors: ToolDescriptor[]
}

export interface McpServerHandlerConfig {
  apiKey: string
  serverDescription: string
  serverName: string
  toolDescriptors: ToolDescriptor[]
}

export interface McpInvokeRequest {
  input: Record<string, any>
  tool: string
}

export interface McpInvokeResponse {
  error?: {
    code: string
    message: string
  }
  result?: any
  success: boolean
}

export interface McpListToolsResponse {
  serverInfo: {
    description: string
    name: string
    version: string
  }
  tools: Array<{
    description: string
    inputSchema: JSONSchema7
    name: string
    outputSchema: JSONSchema7
  }>
}

export interface McpSchemaResponse {
  input: JSONSchema7
  output: JSONSchema7
}

// PayloadCMS operation interfaces
export interface PayloadListParams {
  depth?: number
  limit?: number
  page?: number
  select?: Record<string, boolean>
  sort?: string
  where?: Record<string, any>
}

export interface PayloadGetParams {
  depth?: number
  id: string
  select?: Record<string, boolean>
}

export interface PayloadCreateParams {
  data: Record<string, any>
  depth?: number
}

export interface PayloadUpdateParams {
  data: Record<string, any>
  depth?: number
  id: string
}

export interface PayloadDeleteParams {
  id: string
}

// Collection field analysis (updated to include options)
export interface FieldAnalysis {
  description?: string
  hasDefault: boolean
  name: string
  options?: any[]
  required: boolean
  type: string
  validation?: any
}

export interface CollectionAnalysis {
  fields: FieldAnalysis[]
  hasAuth: boolean
  hasUpload: boolean
  mcpOptions?: CollectionMcpOptions
  slug: string
  timestamps: boolean
}

// MCP Protocol types
export interface McpMessage {
  id?: number | string
  jsonrpc: '2.0'
  method: string
  params?: Record<string, any>
}

export interface McpRequest extends McpMessage {
  id: number | string
}

export interface McpResponse {
  error?: {
    code: number
    data?: any
    message: string
  }
  id: number | string
  jsonrpc: '2.0'
  result?: any
}

export interface McpNotification extends McpMessage {
  // Notifications don't have an id
}

// SSE specific types
export interface SseEvent {
  data: string
  event?: string
  id?: string
  retry?: number
}

export interface McpCapabilities {
  prompts?: {
    listChanged?: boolean
  }
  resources?: {
    listChanged?: boolean
    subscribe?: boolean
  }
  sampling?: any
  tools?: {
    listChanged?: boolean
  }
}

export interface McpInitializeParams {
  capabilities: McpCapabilities
  clientInfo: {
    name: string
    version: string
  }
  protocolVersion: string
}

export interface McpInitializeResponse {
  capabilities: McpCapabilities
  protocolVersion: string
  serverInfo: {
    name: string
    version: string
  }
}
