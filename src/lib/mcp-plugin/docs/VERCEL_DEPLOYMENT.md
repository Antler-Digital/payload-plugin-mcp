# Media Upload on Vercel Deployment

## Important Considerations for Serverless

When deploying to Vercel, the media upload functionality has specific constraints due to the serverless nature of the platform:

### Serverless Limitations

1. **No Persistent Memory**: Each function invocation is isolated
2. **Cold Starts**: Functions can restart at any time, losing in-memory data
3. **Execution Time Limits**:
   - Hobby: 10 seconds max
   - Pro: 60 seconds max
   - Enterprise: 900 seconds max
4. **Request Body Size**: 4.5MB limit (affects base64 uploads)

## Recommended Strategies for Vercel

### Strategy 1: Direct Upload (Recommended for < 750KB)
✅ **Works perfectly on Vercel**

```javascript
// Files under 750KB work great with direct base64
const result = await mcp.call('media_upload', {
  base64Data: smallImageBase64,
  filename: 'logo.png',
  mimeType: 'image/png',
  alt: 'Company logo'
});
```

### Strategy 2: URL-Based Upload (Recommended for > 750KB)
✅ **Best for Vercel deployment**

For larger files, upload to external storage first:

```javascript
// 1. Upload to Vercel Blob Storage directly
const blob = await put('large-file.jpg', fileBuffer, {
  access: 'public',
});

// 2. Use the URL with MCP
const result = await mcp.call('media_upload', {
  url: blob.url,
  filename: 'large-file.jpg',
  mimeType: 'image/jpeg',
  alt: 'Large image'
});
```

### Strategy 3: Chunked Upload (Limited on Vercel)
⚠️ **Not recommended for production on Vercel**

Chunked uploads rely on in-memory storage which doesn't persist across serverless invocations. This means:
- Chunks may be lost between function calls
- Cold starts will lose all pending uploads
- Not suitable for production use

**If you must use chunked uploads on Vercel**, implement persistent storage:

```javascript
// Example: Using Vercel KV for chunk storage
import { kv } from '@vercel/kv';

// Store chunks in KV instead of memory
async function storeChunk(uploadId: string, chunkIndex: number, data: string) {
  const key = `upload:${uploadId}:chunk:${chunkIndex}`;
  await kv.set(key, data, { ex: 1800 }); // 30 minute expiry
}

async function getChunks(uploadId: string, totalChunks: number) {
  const chunks = [];
  for (let i = 0; i < totalChunks; i++) {
    const key = `upload:${uploadId}:chunk:${i}`;
    const data = await kv.get(key);
    if (data) chunks[i] = Buffer.from(data, 'base64');
  }
  return chunks;
}
```

## Vercel Blob Storage Integration

Since your project uses Vercel Blob Storage, here's the optimal approach:

### Direct Upload to Blob Storage

```javascript
import { put } from '@vercel/blob';

// For MCP clients that need to upload large files:
async function uploadLargeFile(file: Buffer, filename: string) {
  // 1. Upload directly to Vercel Blob
  const blob = await put(filename, file, {
    access: 'public',
    addRandomSuffix: true,
  });
  
  // 2. Register with PayloadCMS via MCP
  const result = await mcp.call('media_upload', {
    url: blob.url,
    filename: filename,
    mimeType: 'auto-detect',
    alt: 'Uploaded via Vercel Blob'
  });
  
  return result;
}
```

### Presigned URLs for Client Uploads

For the best performance, generate presigned URLs:

```javascript
// API endpoint to generate upload URL
export async function POST(request: Request) {
  const { filename, mimeType } = await request.json();
  
  // Generate presigned URL
  const response = await fetch(
    `${process.env.BLOB_STORE_URL}/upload?filename=${filename}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`,
      },
    }
  );
  
  const { url, uploadUrl } = await response.json();
  
  return Response.json({ uploadUrl, finalUrl: url });
}

// Client uploads directly to Blob Storage
const { uploadUrl, finalUrl } = await getPresignedUrl(filename);
await fetch(uploadUrl, {
  method: 'PUT',
  body: file,
});

// Then register with PayloadCMS
await mcp.call('media_upload', {
  url: finalUrl,
  filename: filename,
  mimeType: mimeType,
  alt: description
});
```

## MCP Client Guidelines for Vercel

When using the MCP client with media uploads on Vercel:

### 1. Always Check Size First

```javascript
const sizeCheck = await mcp.call('media_check_size', {
  fileSize: fileBuffer.length
});

// Use the recommended strategy
switch (sizeCheck.recommendedStrategy.strategy) {
  case 'direct':
    // Safe for Vercel
    await directUpload(fileBuffer);
    break;
  case 'chunked':
    // Not recommended on Vercel
    console.warn('Consider using URL upload instead');
    // Fall through to URL
  case 'url':
    // Best for Vercel
    await urlBasedUpload(fileBuffer);
    break;
}
```

### 2. Handle Multiple Concurrent Uploads

```javascript
// Concurrent uploads work fine with URL-based approach
const uploads = await Promise.all(
  files.map(async (file) => {
    // Upload to Blob Storage first
    const blob = await put(file.name, file.buffer, { access: 'public' });
    
    // Register with PayloadCMS
    return mcp.call('media_upload', {
      url: blob.url,
      filename: file.name,
      mimeType: file.type,
      alt: file.description
    });
  })
);
```

### 3. Error Handling for Serverless

```javascript
async function uploadWithRetry(file, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      // For Vercel, prefer URL-based upload
      if (file.size > 750 * 1024) {
        // Upload to external storage first
        const url = await uploadToExternalStorage(file);
        return await mcp.call('media_upload', {
          url,
          filename: file.name,
          mimeType: file.type,
          alt: file.alt
        });
      } else {
        // Small file, direct upload
        return await mcp.call('media_upload', {
          base64Data: file.base64,
          filename: file.name,
          mimeType: file.type,
          alt: file.alt
        });
      }
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      // Wait before retry (exponential backoff)
      await new Promise(r => setTimeout(r, 1000 * Math.pow(2, i)));
    }
  }
}
```

## Environment Variables for Vercel

Ensure these are set in your Vercel project:

```env
# Required for Blob Storage
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxx

# Required for PayloadCMS
DATABASE_URI=mongodb+srv://...
PAYLOAD_SECRET=your-secret-key
NEXT_PUBLIC_SERVER_URL=https://your-domain.vercel.app

# Optional for MCP
MCP_API_KEY=your-mcp-api-key
```

## Summary for MCP Clients

When implementing an MCP client that uses media uploads on Vercel:

1. **Always use `media_check_size` first** to determine the best strategy
2. **Prefer URL-based uploads** for files > 750KB
3. **Avoid chunked uploads** unless you implement persistent storage
4. **Use Vercel Blob Storage** directly for best performance
5. **Handle cold starts** with proper error handling and retries
6. **Respect execution time limits** - large files should use presigned URLs
7. **Multiple concurrent uploads** work best with URL-based approach

## Quick Decision Tree

```
File Size?
├─ < 750KB
│  └─ ✅ Use media_upload with base64Data
├─ 750KB - 4MB
│  └─ ✅ Use URL upload (upload to Blob first, then media_upload with URL)
└─ > 4MB
   └─ ❌ Exceeds PayloadCMS limit, need to compress or reject
```