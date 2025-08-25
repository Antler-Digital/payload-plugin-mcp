import { AsyncLocalStorage } from 'node:async_hooks'

export type McpAuthContext = {
  tokenId?: string
  userId?: string
  userRole?: string
  scopes: string[]
}

const storage = new AsyncLocalStorage<McpAuthContext>()

export function runWithAuthContext<T>(ctx: McpAuthContext, fn: () => Promise<T> | T): Promise<T> | T {
  return storage.run(ctx, fn) as any
}

export function getAuthContext(): McpAuthContext | undefined {
  return storage.getStore()
}

