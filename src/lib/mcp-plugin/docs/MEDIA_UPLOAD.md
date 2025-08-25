# Media Upload via MCP Plugin

The MCP plugin now supports multiple methods for uploading images and videos to PayloadCMS's Media collection. This documentation explains how to use these features and handle various file sizes efficiently.

## File Size Limits

- **PayloadCMS Limit**: 4MB (configured in `payload.config.ts`)
- **Base64 Encoding**: Increases data size by ~33%
- **MCP Message Limits**: Typically 1-10MB depending on transport

## Available Tools

### 1. `media_upload` - Direct Upload

Upload images or videos using base64 encoding or URL download.

#### For Small Files (< 3MB)
```json
{
  "tool": "media_upload",
  "arguments": {
    "base64Data": "iVBORw0KGgoAAAANS...", // Base64 encoded file
    "filename": "logo.png",
    "mimeType": "image/png",
    "alt": "Company logo",
    "fileSize": 245678
  }
}
```

#### For External URLs
```json
{
  "tool": "media_upload",
  "arguments": {
    "url": "https://example.com/image.jpg",
    "filename": "downloaded-image.jpg", // Optional, will be extracted from URL
    "mimeType": "image/jpeg", // Optional, will be detected
    "alt": "Downloaded image description"
  }
}
```

### 2. `media_upload_chunk` - Chunked Upload

For large files that exceed MCP message limits, use chunked upload.

#### First Chunk (Initialize)
```json
{
  "tool": "media_upload_chunk",
  "arguments": {
    "chunkIndex": 0,
    "totalChunks": 5,
    "chunkData": "iVBORw0KGgoAAAANS...",
    "filename": "large-video.mp4",
    "mimeType": "video/mp4",
    "alt": "Product demo video",
    "fileSize": 3500000
  }
}
```

Response will include an `uploadId`:
```json
{
  "success": true,
  "uploadId": "upload_1234567890_abc123"
}
```

#### Subsequent Chunks
```json
{
  "tool": "media_upload_chunk",
  "arguments": {
    "uploadId": "upload_1234567890_abc123",
    "chunkIndex": 1,
    "totalChunks": 5,
    "chunkData": "continuation-base64-data..."
  }
}
```

#### Final Chunk (Auto-completes)
When the last chunk is received, the file is automatically assembled and uploaded:
```json
{
  "success": true,
  "id": "media-document-id",
  "url": "https://storage.example.com/media/large-video.mp4",
  "sizes": {
    "thumbnail": { "url": "...", "width": 250, "height": 250 }
  }
}
```

### 3. `media_check_size` - Validate & Get Strategy

Check if a file size is valid and get the recommended upload strategy.

```json
{
  "tool": "media_check_size",
  "arguments": {
    "fileSize": 2500000 // 2.5MB
  }
}
```

Response:
```json
{
  "valid": true,
  "maxSize": 4096000,
  "maxSizeMB": "4.00",
  "fileSizeMB": "2.38",
  "recommendedStrategy": {
    "strategy": "chunked",
    "reason": "File requires chunked upload due to MCP message size limits",
    "recommendedChunkSize": 524288
  }
}
```

## Upload Strategies

The system automatically determines the best upload strategy based on file size:

| File Size | Base64 Size | Strategy | Reason |
|-----------|-------------|----------|---------|
| < 750KB | < 1MB | Direct Base64 | Small enough for single message |
| 750KB - 3MB | 1MB - 4MB | Chunked | Exceeds safe MCP message size |
| > 3MB | > 4MB | URL | Too large for base64 transfer |
| > 4MB | - | Error | Exceeds PayloadCMS limit |

## Implementation Details

### Chunking Logic
- Default chunk size: 512KB (conservative for safety)
- Chunks are stored in memory temporarily (30-minute timeout)
- Missing chunks are detected and reported
- Size verification after assembly

### Storage Handling
- Uses PayloadCMS Local API for uploads
- Integrates with Vercel Blob Storage (when configured)
- Generates multiple image sizes as configured in Media collection
- Triggers afterChange hooks for cache revalidation

### Error Handling
- File size validation before processing
- MIME type validation (images and videos only)
- Chunk integrity verification
- Automatic cleanup of incomplete uploads

## Example: Complete Upload Flow

```javascript
// 1. Check file size first
const sizeCheck = await mcpClient.call('media_check_size', {
  fileSize: fileBuffer.length
});

if (!sizeCheck.valid) {
  throw new Error(sizeCheck.error);
}

// 2. Based on strategy, choose upload method
if (sizeCheck.recommendedStrategy.strategy === 'direct') {
  // Direct upload for small files
  const result = await mcpClient.call('media_upload', {
    base64Data: fileBuffer.toString('base64'),
    filename: 'image.jpg',
    mimeType: 'image/jpeg',
    alt: 'Product image',
    fileSize: fileBuffer.length
  });
  
} else if (sizeCheck.recommendedStrategy.strategy === 'chunked') {
  // Chunked upload for medium files
  const chunkSize = 512 * 1024; // 512KB chunks
  const totalChunks = Math.ceil(fileBuffer.length / chunkSize);
  let uploadId = null;
  
  for (let i = 0; i < totalChunks; i++) {
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, fileBuffer.length);
    const chunk = fileBuffer.slice(start, end);
    
    const args = {
      chunkIndex: i,
      totalChunks: totalChunks,
      chunkData: chunk.toString('base64'),
      ...(i === 0 ? {
        filename: 'image.jpg',
        mimeType: 'image/jpeg',
        alt: 'Product image',
        fileSize: fileBuffer.length
      } : {
        uploadId: uploadId
      })
    };
    
    const result = await mcpClient.call('media_upload_chunk', args);
    
    if (i === 0) {
      uploadId = result.uploadId;
    }
  }
  
} else if (sizeCheck.recommendedStrategy.strategy === 'url') {
  // URL upload for large files
  // First upload to external storage, then provide URL
  const externalUrl = await uploadToExternalStorage(fileBuffer);
  
  const result = await mcpClient.call('media_upload', {
    url: externalUrl,
    alt: 'Large video file'
  });
}
```

## Best Practices

1. **Always validate file size** before attempting upload
2. **Use appropriate strategy** based on file size
3. **Provide alt text** for accessibility
4. **Handle errors gracefully** - chunked uploads can fail mid-stream
5. **Clean up external URLs** after successful URL-based uploads
6. **Monitor chunk timeout** - uploads expire after 30 minutes

## Limitations

- Maximum file size: 4MB (configurable in PayloadCMS)
- Supported types: Images (image/*) and Videos (video/*)
- Chunk timeout: 30 minutes
- Memory usage: Chunks are stored in memory during assembly

## Troubleshooting

### "File size exceeds maximum"
- Check PayloadCMS upload limits in `payload.config.ts`
- Consider using external storage for very large files

### "Missing chunks"
- Ensure all chunks are sent in order
- Check for network interruptions
- Verify chunk indices are sequential

### "Upload session not found"
- Upload sessions expire after 30 minutes
- Ensure uploadId is passed correctly
- Start a new upload if session expired