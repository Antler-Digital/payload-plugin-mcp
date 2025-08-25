# Troubleshooting Guide

This guide helps you resolve common issues when using the PayloadCMS MCP Integration Plugin.

## Table of Contents

- [Common Issues](#common-issues)
- [Authentication Problems](#authentication-problems)
- [Collection Issues](#collection-issues)
- [MCP Protocol Errors](#mcp-protocol-errors)
- [Performance Issues](#performance-issues)
- [Deployment Issues](#deployment-issues)
- [Debug Mode](#debug-mode)
- [Getting Help](#getting-help)

## Common Issues

### 1. Plugin Not Loading

**Symptoms**: Plugin doesn't appear in admin, MCP endpoint not accessible

**Possible Causes**:

- Plugin not properly imported in `payload.config.ts`
- Syntax errors in configuration
- Missing dependencies

**Solutions**:

```typescript
// Ensure proper import
import { PayloadPluginMcp } from 'payloadcms-mcp-plugin'

// Check plugin configuration
export default buildConfig({
  plugins: [
    PayloadPluginMcp({
      apiKey: process.env.MCP_API_KEY,
      collections: 'all',
    }),
  ],
})
```

**Verification**:

- Check browser console for errors
- Verify plugin appears in PayloadCMS admin
- Test MCP endpoint at `/plugin/mcp`

### 2. "No API key provided" Warning

**Symptoms**: Console warning about missing API key

**Solutions**:

```bash
# .env file
MCP_API_KEY=your-secret-api-key-here

# Or set directly in config
PayloadPluginMcp({
  apiKey: 'your-secret-key', // Not recommended for production
  collections: 'all',
})
```

**Verification**:

- Restart development server after changing `.env`
- Check environment variable is loaded: `console.log(process.env.MCP_API_KEY)`

### 3. MCP Endpoint Not Found

**Symptoms**: 404 errors when accessing `/plugin/mcp`

**Possible Causes**:

- Plugin not properly installed
- Route conflicts
- Server configuration issues

**Solutions**:

```typescript
// Ensure plugin is in plugins array
export default buildConfig({
  plugins: [
    PayloadPluginMcp({
      apiKey: process.env.MCP_API_KEY,
      collections: 'all',
    }),
  ],
})

// Check for route conflicts
// Ensure no other routes use /plugin/mcp
```

## Authentication Problems

### 1. "Authentication Failed" Errors

**Symptoms**: 401 errors with "Authentication failed" message

**Possible Causes**:

- Missing or invalid API key
- Incorrect header format
- Expired tokens

**Solutions**:

```typescript
// Correct header format
headers: {
  'Authorization': 'Bearer your-api-key-here',
  'Content-Type': 'application/json',
}

// Verify API key matches
console.log('API Key:', process.env.MCP_API_KEY)
```

**Verification**:

- Check API key in request headers
- Verify key matches environment variable
- Test with simple GET request to `/plugin/mcp`

### 2. Token Authentication Issues

**Symptoms**: Token-based authentication not working

**Possible Causes**:

- Token not properly created
- Token expired
- Insufficient permissions

**Solutions**:

```typescript
// Check token in admin interface
// Verify token hasn't expired
// Check user permissions

// Create new token if needed
// Ensure token has required scopes
```

### 3. Permission Denied Errors

**Symptoms**: 403 errors with "Permission denied" message

**Possible Causes**:

- User lacks required permissions
- Collection access controls too restrictive
- Token scope limitations

**Solutions**:

```typescript
// Check collection access controls
access: {
  read: ({ req }) => req.user?.role === 'admin',
  create: ({ req }) => req.user?.role === 'editor',
}

// Verify user role and permissions
// Check token scopes
```

## Collection Issues

### 1. "Collection Not Found" Errors

**Symptoms**: Errors when trying to access collections via MCP

**Possible Causes**:

- Collection not properly imported
- Collection slug mismatch
- Collection not exposed in plugin config

**Solutions**:

```typescript
// Ensure collection is imported
import { Posts } from './collections/Posts'

// Verify collection slug
export const Posts: CollectionConfig = {
  slug: 'posts', // This must match exactly
}

// Check plugin configuration
PayloadPluginMcp({
  collections: [Posts], // Explicitly include collection
  // or
  collections: 'all', // Include all collections
})
```

**Verification**:

- Check collection slugs in admin interface
- Verify collections appear in MCP tool list
- Test with simple collection operations

### 2. Field Access Issues

**Symptoms**: Certain fields not accessible via MCP

**Possible Causes**:

- Fields excluded in configuration
- Access control restrictions
- Field type not supported

**Solutions**:

```typescript
// Check field exclusions
{
  collection: Posts,
  options: {
    excludeFields: ['internalNotes'], // Fields to exclude
  },
}

// Verify field access controls
fields: [
  {
    name: 'content',
    type: 'textarea',
    access: {
      read: ({ req }) => req.user?.role === 'editor',
    },
  },
]
```

### 3. Relationship Population Issues

**Symptoms**: Related fields not populated in responses

**Possible Causes**:

- Insufficient population depth
- Relationship configuration issues
- Access control restrictions

**Solutions**:

```typescript
// Increase population depth
{
  tool: 'posts_get',
  arguments: {
    id: 'post-id',
    depth: 2, // Increase for nested relationships
  },
}

// Check relationship field configuration
{
  name: 'author',
  type: 'relationship',
  relationTo: 'users',
  hasMany: false,
}
```

## MCP Protocol Errors

### 1. "Invalid Tool" Errors

**Symptoms**: MCP reports tool not found

**Possible Causes**:

- Tool name mismatch
- Tool not properly registered
- Collection not exposed

**Solutions**:

```typescript
// Check tool naming convention
// Tools follow pattern: {collection}_{operation}
// Examples: posts_list, users_get, media_upload

// Verify available tools
GET / plugin / mcp // Lists all available tools

// Check collection exposure
PayloadPluginMcp({
  collections: 'all', // or specific collections
})
```

### 2. "Invalid Arguments" Errors

**Symptoms**: MCP reports invalid arguments for tools

**Possible Causes**:

- Missing required arguments
- Invalid argument types
- Schema validation failures

**Solutions**:

```typescript
// Check required arguments
{
  tool: 'posts_get',
  arguments: {
    id: 'post-id', // Required
    depth: 1, // Optional
  },
}

// Verify argument types
// Use proper data types (string, number, boolean, object)
```

### 3. MCP Connection Issues

**Symptoms**: MCP client can't connect to server

**Possible Causes**:

- Server not running
- Port conflicts
- Network configuration issues

**Solutions**:

```bash
# Check server status
curl http://localhost:3000/plugin/mcp

# Verify port configuration
# Check for port conflicts
# Ensure firewall allows connections
```

## Performance Issues

### 1. Slow Response Times

**Symptoms**: MCP operations take too long

**Possible Causes**:

- Large dataset queries
- Complex relationships
- Database performance issues

**Solutions**:

```typescript
// Limit result sets
{
  tool: 'posts_list',
  arguments: {
    limit: 10, // Limit results
    page: 1,
  },
}

// Optimize queries
// Use proper indexes
// Limit population depth
```

### 2. Memory Issues

**Symptoms**: High memory usage, crashes

**Possible Causes**:

- Large file uploads
- Memory leaks in chunked uploads
- Insufficient server resources

**Solutions**:

```typescript
// Enable chunking for large files
media: {
  enableChunking: true,
}

// Monitor memory usage
// Increase server resources if needed
```

## Deployment Issues

### 1. Vercel Deployment Problems

**Symptoms**: Plugin works locally but fails on Vercel

**Possible Causes**:

- Environment variables not set
- Serverless function limitations
- Build configuration issues

**Solutions**:

```bash
# Set environment variables in Vercel
vercel env add MCP_API_KEY

# Check Vercel function logs
# Verify build output
```

### 2. Docker Deployment Issues

**Symptoms**: Plugin not working in Docker container

**Possible Causes**:

- Environment variables not passed to container
- Port mapping issues
- Volume mount problems

**Solutions**:

```dockerfile
# Pass environment variables
ENV MCP_API_KEY=your-key

# Expose correct ports
EXPOSE 3000

# Mount volumes correctly
VOLUME /app/uploads
```

## Debug Mode

Enable debug logging to get more detailed information:

```typescript
PayloadPluginMcp({
  apiKey: process.env.MCP_API_KEY,
  collections: 'all',
  debug: true, // Enable debug logging
})
```

### Debug Information

When debug mode is enabled, you'll see:

- Plugin initialization details
- Collection analysis information
- MCP tool registration details
- Request/response logging
- Error stack traces

### Debug Output

```bash
# Check console for debug information
PayloadCMS MCP Plugin: Initializing...
PayloadCMS MCP Plugin: Exposing collections: posts, users, media
PayloadCMS MCP Plugin: Registered tools: posts_list, posts_get, users_list, users_get
```

## Getting Help

### 1. Self-Diagnosis

1. **Enable debug mode** to get detailed logging
2. **Check browser console** for JavaScript errors
3. **Verify configuration** matches examples
4. **Test with minimal setup** to isolate issues

### 2. Community Resources

- [GitHub Issues](https://github.com/your-org/payloadcms-mcp-plugin/issues)
- [GitHub Discussions](https://github.com/your-org/payloadcms-mcp-plugin/discussions)
- [PayloadCMS Community](https://discord.gg/payload)

### 3. Reporting Issues

When reporting issues, include:

````markdown
**Environment**:

- PayloadCMS version: X.X.X
- Plugin version: X.X.X
- Node.js version: X.X.X
- Database: MongoDB/PostgreSQL

**Issue Description**:

- What you're trying to do
- What happens instead
- Error messages (if any)

**Configuration**:

```typescript
// Your plugin configuration
```
````

**Steps to Reproduce**:

1. Step 1
2. Step 2
3. Step 3

**Expected Behavior**:
What you expected to happen

**Actual Behavior**:
What actually happened

````

### 4. Emergency Workarounds

If you need a quick fix:

1. **Disable plugin temporarily**:
   ```typescript
   // Comment out plugin to isolate issues
   // plugins: [
   //   PayloadPluginMcp({...}),
   // ],
````

2. **Use minimal configuration**:

   ```typescript
   PayloadPluginMcp({
     apiKey: 'test-key',
     collections: 'all',
   })
   ```

3. **Check PayloadCMS logs** for additional error information
