# Vercel Deployment Example

This example shows how to deploy a PayloadCMS application with the MCP plugin to Vercel.

## Key Features

- Serverless deployment optimized for Vercel
- Custom API route for MCP endpoints
- Environment variable configuration
- CORS headers for cross-origin requests
- Proper error handling and logging

## Project Structure

```
vercel-example/
├── app/
│   ├── api/
│   │   └── mcp/
│   │       └── [...path]/
│   │           └── route.ts      # MCP API route handler
│   ├── (payload)/               # Payload admin routes
│   └── layout.tsx
├── payload.config.ts            # Payload configuration
├── vercel.json                  # Vercel configuration
└── package.json
```

## Setup

1. **Clone the example:**

```bash
cd examples/vercel
npm install
```

2. **Configure environment variables locally:**

Create a `.env.local` file:

```env
# Database (use MongoDB Atlas for production)
DATABASE_URI=mongodb+srv://username:password@cluster.mongodb.net/database

# MCP Plugin
MCP_API_KEY=your-secret-api-key-here

# Payload
PAYLOAD_SECRET=your-payload-secret-key
PAYLOAD_CONFIG_PATH=./payload.config.ts
```

3. **Test locally:**

```bash
npm run dev
```

Visit `http://localhost:3000/api/mcp` to test the MCP endpoint.

## Vercel Deployment

1. **Install Vercel CLI:**

```bash
npm i -g vercel
```

2. **Set up environment variables in Vercel:**

```bash
# Add your environment variables
vercel env add MCP_API_KEY
vercel env add DATABASE_URI
vercel env add PAYLOAD_SECRET
```

Or use the Vercel dashboard to add environment variables.

3. **Deploy:**

```bash
vercel --prod
```

## Configuration Details

### API Route Handler

The `api/mcp/[...path]/route.ts` file handles all MCP requests:

- **GET requests**: Server discovery and tool listing
- **POST requests**: Tool invocation and MCP protocol messages
- **OPTIONS requests**: CORS preflight handling

### Vercel Configuration

The `vercel.json` file configures:

- **Function timeout**: 30 seconds for MCP operations
- **Environment variables**: References to Vercel secrets
- **CORS headers**: Proper cross-origin support

### Payload Configuration

The plugin is configured to work in serverless environments:

```typescript
PayloadPluginMcp({
  apiKey: process.env.MCP_API_KEY,
  collections: 'all',
  // Plugin automatically works with Payload's endpoint system
})
```

## Claude Desktop Integration

Once deployed, add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "payload-production": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote",
        "https://your-app.vercel.app/api/mcp",
        "--header",
        "Authorization: Bearer ${MCP_API_KEY}"
      ],
      "env": {
        "MCP_API_KEY": "your-api-key"
      }
    }
  }
}
```

## Testing the Deployment

Test your deployed MCP server:

```bash
# Check server status
curl -H "Authorization: Bearer your-api-key" \
     https://your-app.vercel.app/api/mcp

# Test tool invocation
curl -X POST \
     -H "Authorization: Bearer your-api-key" \
     -H "Content-Type: application/json" \
     -d '{
       "jsonrpc": "2.0",
       "id": 1,
       "method": "tools/call",
       "params": {
         "name": "posts_list",
         "arguments": {
           "limit": 5
         }
       }
     }' \
     https://your-app.vercel.app/api/mcp
```

## Performance Optimization

For production deployments:

1. **Database**: Use MongoDB Atlas or similar managed service
2. **Caching**: Enable Vercel's edge caching where appropriate
3. **Monitoring**: Set up error tracking and performance monitoring
4. **Rate Limiting**: Consider implementing rate limiting for API endpoints

## Troubleshooting

### Common Issues

1. **Function Timeout**: Increase `maxDuration` in `vercel.json`
2. **Environment Variables**: Ensure all required env vars are set in Vercel
3. **Database Connection**: Use connection pooling for MongoDB
4. **CORS Issues**: Check that CORS headers are properly configured

### Debugging

Enable debug logging by adding to your environment variables:

```env
DEBUG=payload:*
```

Check Vercel function logs for detailed error information.

## Security Considerations

- Use strong API keys and rotate them regularly
- Implement rate limiting for production use
- Use HTTPS only (Vercel provides this automatically)
- Consider IP whitelisting for sensitive operations
- Monitor API usage and set up alerts for unusual activity
