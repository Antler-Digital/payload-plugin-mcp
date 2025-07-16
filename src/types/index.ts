import type { CollectionConfig, Field } from 'payload'

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

export interface AuthConfig {
  apiKey: string
}

export interface McpServerConfig {
  toolDescriptors: ToolDescriptor[]
  port: number
  host: string
  apiKey: string
  serverName: string
  serverDescription: string
  enableStdio: boolean
}

export interface McpServerHandlerConfig {
  toolDescriptors: ToolDescriptor[]
  apiKey: string
  serverName: string
  serverDescription: string
}

export interface McpInvokeRequest {
  tool: string
  input: Record<string, any>
}

export interface McpInvokeResponse {
  success: boolean
  result?: any
  error?: {
    message: string
    code: string
  }
}

export interface McpListToolsResponse {
  tools: Array<{
    name: string
    description: string
    inputSchema: JSONSchema7
    outputSchema: JSONSchema7
  }>
  serverInfo: {
    name: string
    description: string
    version: string
  }
}

export interface McpSchemaResponse {
  input: JSONSchema7
  output: JSONSchema7
}

// PayloadCMS operation interfaces
export interface PayloadListParams {
  where?: Record<string, any>
  limit?: number
  page?: number
  sort?: string
  select?: Record<string, boolean>
  depth?: number
}

export interface PayloadGetParams {
  id: string
  depth?: number
  select?: Record<string, boolean>
}

export interface PayloadCreateParams {
  data: Record<string, any>
  depth?: number
}

export interface PayloadUpdateParams {
  id: string
  data: Record<string, any>
  depth?: number
}

export interface PayloadDeleteParams {
  id: string
}

// Collection field analysis
export interface FieldAnalysis {
  name: string
  type: string
  required: boolean
  hasDefault: boolean
  description?: string
  options?: any[]
  validation?: any
}

export interface CollectionAnalysis {
  slug: string
  fields: FieldAnalysis[]
  hasUpload: boolean
  hasAuth: boolean
  timestamps: boolean
}

// MCP Protocol types
export interface McpMessage {
  jsonrpc: '2.0'
  id?: string | number
  method: string
  params?: Record<string, any>
}

export interface McpRequest extends McpMessage {
  id: string | number
}

export interface McpResponse {
  jsonrpc: '2.0'
  id: string | number
  result?: any
  error?: {
    code: number
    message: string
    data?: any
  }
}

export interface McpNotification extends McpMessage {
  // Notifications don't have an id
}

// SSE specific types
export interface SseEvent {
  event?: string
  data: string
  id?: string
  retry?: number
}

export interface McpCapabilities {
  tools?: {
    listChanged?: boolean
  }
  resources?: {
    subscribe?: boolean
    listChanged?: boolean
  }
  prompts?: {
    listChanged?: boolean
  }
  sampling?: {}
}

export interface McpInitializeParams {
  protocolVersion: string
  capabilities: McpCapabilities
  clientInfo: {
    name: string
    version: string
  }
}

export interface McpInitializeResponse {
  protocolVersion: string
  capabilities: McpCapabilities
  serverInfo: {
    name: string
    version: string
  }
}