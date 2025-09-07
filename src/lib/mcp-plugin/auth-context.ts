import { AsyncLocalStorage } from 'node:async_hooks'

export type McpAuthContext = {
  scopes: string[]
  tokenId?: string
  userId?: string
  userRole?: string
}

const storage = new AsyncLocalStorage<McpAuthContext>()

export function runWithAuthContext<T>(ctx: McpAuthContext, fn: () => Promise<T> | T): Promise<T> | T {
  return storage.run(ctx, fn) as any
}

export function getAuthContext(): McpAuthContext | undefined {
  return storage.getStore()
}

