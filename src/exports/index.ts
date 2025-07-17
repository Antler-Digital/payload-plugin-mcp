export { payloadPluginMcp } from '../index.js'
export type { PayloadPluginMcpConfig } from '../index.js'
export * from '../types/index.js'

// Also export utilities for standalone use
export { generateToolDescriptors } from '../lib/toolGenerator.js'
export { startMcpServer, stopMcpServer, createStandaloneMcpServer } from '../lib/mcpServer.js'
export { mcpServerHandler } from '../endpoints/mcpServerHandler.js'