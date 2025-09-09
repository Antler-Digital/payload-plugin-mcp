/* eslint-disable @typescript-eslint/no-explicit-any */
import type { BasePayload } from 'payload'
import type { CollectionSlug } from 'payload'

import { getAuthContext } from '../auth-context.js'

/**
 * Media Upload Handler for MCP Plugin
 *
 * This module handles various methods of uploading media to PayloadCMS:
 * 1. Base64 encoded data (for small files)
 * 2. URL-based uploads (downloading from external sources)
 * 3. Chunked uploads (for large files that exceed MCP message limits)
 *
 * IMPORTANT CONSIDERATIONS:
 * - Base64 encoding increases data size by ~33%
 * - MCP typically has message size limits (varies by transport, usually 1-10MB)
 * - PayloadCMS has configurable upload limits (default 4MB in this project)
 * - For files > 3MB, prefer URL-based or chunked uploads
 */

/**
 * IMPORTANT: Chunk Storage Strategy
 *
 * In serverless environments like Vercel:
 * - Each function invocation is isolated (no shared memory)
 * - Functions can cold start at any time
 * - Maximum execution time is limited (10s for hobby, 60s for pro)
 *
 * For production on Vercel, consider:
 * 1. Using external storage (Redis, KV store) for chunk management
 * 2. Uploading directly to Vercel Blob Storage via presigned URLs
 * 3. Using the URL-based upload method for files > 750KB
 *
 * This in-memory store works for:
 * - Local development
 * - Long-running server deployments
 * - Small files that complete in a single request
 */

// Store for managing chunked uploads (WARNING: Not persistent across serverless invocations)
const chunkStore = new Map<
  string,
  {
    chunks: Buffer[]
    createdAt: number
    metadata: {
      expectedChunks: number
      filename: string
      mimeType: string
      totalSize: number
    }
  }
>()

// Clean up old incomplete uploads after 30 minutes
const CHUNK_TIMEOUT = 30 * 60 * 1000

// List of environment variables commonly set by serverless platforms
const SERVERLESS_ENV_VARS = [
  'VERCEL',
  'AWS_LAMBDA_FUNCTION_NAME',
  'NETLIFY',
  'FUNCTIONS_WORKER_RUNTIME', // Azure Functions
  'K_SERVICE', // Google Cloud Run
  'FUNCTION_NAME', // Google Cloud Functions
  'CF_PAGES', // Cloudflare Pages
] as const

// For Vercel deployment, we should use KV storage or similar
// Example: @vercel/kv for persistent chunk storage
// Check if the environment is serverless (no need to wait for process.env because these are constants in Node.js)
const IS_SERVERLESS = SERVERLESS_ENV_VARS.some((varName) => process.env[varName])

if (IS_SERVERLESS) {
  console.warn(
    '[MCP Media Upload] Running in serverless environment. Chunked uploads may not persist across invocations. Consider using URL-based uploads for large files.',
  )
}

export interface MediaUploadOptions {
  /** Additional fields for the media document */
  additionalData?: Record<string, any>
  alt: string
  /** Base64 encoded file data (for small files < 3MB) */
  base64Data?: string
  /** Chunk data for large file uploads */
  chunkData?: {
    chunkIndex: number
    data: string // Base64 encoded chunk
    totalChunks: number
    uploadId: string
  }
  /** File metadata */
  filename: string
  /** File size in bytes (required for validation) */
  fileSize?: number
  mimeType: string
  /** URL to download the file from */
  url?: string
}

export interface MediaUploadResult {
  error?: string
  id?: string
  sizes?: Record<string, { height?: number; url: string; width?: number }>
  success: boolean
  uploadId?: string // For chunked uploads
  url?: string
}

/**
 * Get the maximum file size from PayloadCMS configuration
 */
export function getMaxFileSize(config: any): number {
  // Default to 4MB if not configured
  return config?.upload?.limits?.fileSize || 4096000
}

/**
 * Validate file size against PayloadCMS limits
 */
export function validateFileSize(
  size: number,
  config: any,
): { error?: string; maxSize: number; valid: boolean } {
  const maxSize = getMaxFileSize(config)

  if (size > maxSize) {
    return {
      error: `File size ${(size / 1024 / 1024).toFixed(2)}MB exceeds maximum allowed size of ${(maxSize / 1024 / 1024).toFixed(2)}MB`,
      maxSize,
      valid: false,
    }
  }

  return { maxSize, valid: true }
}

/**
 * Determine the best upload strategy based on file size and environment
 */
export function determineUploadStrategy(
  fileSize: number,
  config: any,
  opts?: { enableChunking?: boolean },
): { reason: string; recommendedChunkSize?: number; strategy: 'chunked' | 'direct' | 'url' } {
  const maxSize = getMaxFileSize(config)

  if (fileSize > maxSize) {
    return {
      reason: 'File exceeds PayloadCMS upload limit; use URL-based upload',
      strategy: 'url',
    }
  }

  const base64Size = calculateBase64Size(fileSize)

  // MCP message size limits (conservative estimates)
  const MCP_SAFE_MESSAGE_SIZE = 1 * 1024 * 1024 // 1MB safe limit for MCP messages
  const MCP_CHUNK_SIZE = 512 * 1024 // 512KB chunks for safety

  if (base64Size <= MCP_SAFE_MESSAGE_SIZE) {
    return {
      reason: 'File is small enough for direct base64 upload',
      strategy: 'direct',
    }
  }

  if (opts?.enableChunking) {
    return {
      reason: 'File requires chunked upload due to MCP message size limits',
      recommendedChunkSize: MCP_CHUNK_SIZE,
      strategy: 'chunked',
    }
  }

  return {
    reason: 'File requires URL-based upload due to MCP message size limits and chunking disabled',
    strategy: 'url',
  }
}

/**
 * Calculate the increased size of a base64 encoded file
 */
function calculateBase64Size(originalSize: number): number {
  return Math.ceil((originalSize / 3) * 4)
}

/**
 * Decode a base64 data URL or raw base64 string
 */
function decodeBase64(data: string): { buffer: Buffer; filename?: string; mimeType: string } {
  try {
    if (data.startsWith('data:')) {
      // Data URL format: data:[<mediatype>][;base64],<data>
      const match = data.match(/^data:(.*?);base64,(.*)$/)
      if (!match) {throw new Error('Invalid data URL format')}
      const mimeType = match[1]
      const base64Data = match[2]
      const buffer = Buffer.from(base64Data, 'base64')
      return { buffer, mimeType }
    } else {
      const buffer = Buffer.from(data, 'base64')
      // MIME type must be provided in options
      return { buffer, mimeType: '' }
    }
  } catch (error) {
    throw new Error('Invalid base64 data')
  }
}

/**
 * Download a file from a URL
 */
async function downloadFromUrl(
  url: string,
): Promise<{ buffer: Buffer; filename?: string; mimeType: string }> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to download file from URL: ${response.status} ${response.statusText}`)
  }
  const buffer = Buffer.from(await response.arrayBuffer())
  const mimeType = response.headers.get('content-type') || 'application/octet-stream'

  // Try to parse filename from Content-Disposition
  const contentDisposition = response.headers.get('content-disposition')
  let filename: string | undefined
  if (contentDisposition && contentDisposition.includes('filename=')) {
    filename = contentDisposition.split('filename=')[1]?.replace(/"/g, '')
  }

  return { buffer, filename, mimeType }
}

/**
 * Main upload handler for media files
 */
export async function uploadMedia(
  payload: BasePayload,
  options: MediaUploadOptions,
  config: any,
  opts?: { enableChunking?: boolean },
): Promise<MediaUploadResult> {
  const auth = getAuthContext()
  const scopes = auth?.scopes || []
  if (!scopes.includes('collections:*:*') && !scopes.includes('media:upload')) {
    return { error: 'MCP token lacks media:upload scope', success: false }
  }
  try {
    let fileBuffer: Buffer
    let actualFilename = options.filename
    let actualMimeType = options.mimeType
    let actualSize = options.fileSize || 0

    // Handle different upload methods
    if (options.base64Data) {
      // Direct base64 upload
      fileBuffer = Buffer.from(options.base64Data, 'base64')
      actualSize = fileBuffer.length
    } else if (options.url) {
      // URL-based upload
      const downloaded = await downloadFromUrl(options.url)
      fileBuffer = downloaded.buffer
      actualMimeType = downloaded.mimeType || actualMimeType
      if (downloaded.filename) {actualFilename = downloaded.filename}
      actualSize = fileBuffer.length
    } else if (options.chunkData) {
      // Chunked upload
      if (!opts?.enableChunking) {
        return {
          error:
            'Chunked upload not enabled. Set media.enableChunking: true in MCP plugin config if you understand serverless limitations.',
          success: false,
        }
      }

      const { chunkIndex, data, totalChunks, uploadId } = options.chunkData
      if (!uploadId || totalChunks <= 0) {
        return { error: 'Invalid chunk metadata', success: false }
      }

      // Initialize chunk store
      if (!chunkStore.has(uploadId)) {
        chunkStore.set(uploadId, {
          chunks: new Array(totalChunks).fill(null),
          createdAt: Date.now(),
          metadata: {
            expectedChunks: totalChunks,
            filename: actualFilename,
            mimeType: actualMimeType,
            totalSize: options.fileSize || 0,
          },
        })
      }

      const entry = chunkStore.get(uploadId)!
      const chunkBuffer = Buffer.from(data, 'base64')
      entry.chunks[chunkIndex] = chunkBuffer

      // Cleanup old uploads periodically
      for (const [id, info] of chunkStore.entries()) {
        if (Date.now() - info.createdAt > CHUNK_TIMEOUT) {
          chunkStore.delete(id)
        }
      }

      // Not the last chunk yet
      if (entry.chunks.some((c) => !c)) {
        return { success: true, uploadId }
      }

      // Assemble all chunks
      fileBuffer = Buffer.concat(entry.chunks)
      chunkStore.delete(uploadId)
      actualSize = fileBuffer.length
    } else {
      return {
        error: 'No upload data provided (base64Data, url, or chunkData required)',
        success: false,
      }
    }

    // Validate file size
    const sizeValidation = validateFileSize(actualSize, config)
    if (!sizeValidation.valid) {
      return {
        error: sizeValidation.error,
        success: false,
      }
    }

    // Validate MIME type
    const allowedMimeTypes = ['image/*', 'video/*'] // From Media collection config
    const isAllowedType = allowedMimeTypes.some((pattern) => {
      if (pattern.endsWith('/*')) {
        const prefix = pattern.slice(0, -2)
        return actualMimeType.startsWith(prefix + '/')
      }
      return actualMimeType === pattern
    })

    if (!isAllowedType) {
      return {
        error: `File type ${actualMimeType} is not allowed. Allowed types: ${allowedMimeTypes.join(', ')}`,
        success: false,
      }
    }

    // Use PayloadCMS Local API to create the media document
    // The Local API can handle file uploads programmatically
    const mediaData: any = {
      alt: options.alt,
      ...options.additionalData,
    }

    // Create a mock file object for the Local API
    // PayloadCMS expects file data in a specific format for programmatic uploads
    const file = {
      name: actualFilename,
      data: fileBuffer,
      mimetype: actualMimeType,
      size: actualSize,
    }

    // Create the media document with the file
    // The Local API will handle the file processing and storage
    const result = await payload.create({
      collection: 'media' as CollectionSlug,
      data: mediaData,
      file,
      // Pass a mock request to trigger hooks (for revalidation)
      req: {
        context: {
          fromMCP: true,
          triggerAfterChange: true,
        },
        payload,
      } as any,
    } as any)

    // Extract URLs for different sizes
    const sizes: Record<string, any> = {}
    if ('sizes' in result && result.sizes) {
      for (const [sizeName, sizeData] of Object.entries(result.sizes as Record<string, any>)) {
        if (sizeData && typeof sizeData === 'object') {
          sizes[sizeName] = sizeData
        }
      }
    }

    return {
      id: result.id.toString(),
      error: undefined,
      sizes,
      success: true,
      url: 'url' in result ? (result as any).url : undefined,
    }
  } catch (error) {
    console.error('[MCP] Media upload error:', error)
    return {
      error: error instanceof Error ? error.message : 'Unknown upload error',
      success: false,
    }
  }
}

/**
 * Create media upload tool descriptors with clear guidance for MCP clients
 */
export function createMediaUploadTools() {
  return [
    {
      name: 'media_check_size',
      description:
        'Check if a file size is allowed and get the recommended upload strategy for this environment',
      inputSchema: {
        type: 'object',
        properties: {
          fileSize: { type: 'number', description: 'File size in bytes' },
        },
        required: ['fileSize'],
      },
      outputSchema: {
        type: 'object',
        properties: {
          error: { type: 'string' },
          maxSize: { type: 'number' },
          recommendedStrategy: {
            type: 'object',
            properties: {
              reason: { type: 'string' },
              recommendedChunkSize: { type: 'number' },
              strategy: { type: 'string', enum: ['direct', 'url', 'chunked'] },
            },
          },
          valid: { type: 'boolean' },
        },
      },
    },
    {
      name: 'media_upload',
      description:
        'Upload media via base64, URL, or chunks. For large files on Vercel, prefer URL-based uploads.',
      inputSchema: {
        type: 'object',
        properties: {
          additionalData: { type: 'object', additionalProperties: true },
          alt: { type: 'string' },
          base64Data: { type: 'string' },
          chunkData: {
            type: 'object',
            properties: {
              chunkIndex: { type: 'number' },
              data: { type: 'string' },
              totalChunks: { type: 'number' },
              uploadId: { type: 'string' },
            },
          },
          filename: { type: 'string' },
          fileSize: { type: 'number' },
          mimeType: { type: 'string' },
          url: { type: 'string' },
        },
        required: ['filename', 'mimeType', 'alt'],
      },
      outputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          error: { type: 'string' },
          sizes: { type: 'object', additionalProperties: true },
          success: { type: 'boolean' },
          uploadId: { type: 'string' },
          url: { type: 'string' },
        },
      },
    },
    {
      name: 'media_upload_chunk',
      description:
        'Upload a single chunk for a larger file. Only enable chunking in non-serverless environments.',
      inputSchema: {
        type: 'object',
        properties: {
          additionalData: { type: 'object', additionalProperties: true },
          alt: { type: 'string' },
          chunkIndex: { type: 'number' },
          data: { type: 'string' },
          filename: { type: 'string' },
          fileSize: { type: 'number' },
          mimeType: { type: 'string' },
          totalChunks: { type: 'number' },
          uploadId: { type: 'string' },
        },
        required: ['uploadId', 'chunkIndex', 'totalChunks', 'data', 'filename', 'mimeType', 'alt'],
      },
      outputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          error: { type: 'string' },
          sizes: { type: 'object', additionalProperties: true },
          success: { type: 'boolean' },
          uploadId: { type: 'string' },
          url: { type: 'string' },
        },
      },
    },
  ]
}
