# Basic PayloadCMS MCP Plugin Example

This example demonstrates a basic setup of the PayloadCMS MCP Plugin with minimal configuration.

## Features

- Simple blog-style collections (Posts, Users)
- Read-only MCP tools for all collections
- MongoDB database
- Lexical rich text editor

## Setup

1. **Clone and install dependencies:**

```bash
cd examples/basic-setup
npm install
```

2. **Set up environment variables:**

Create a `.env` file:

```env
# Database
DATABASE_URI=mongodb://localhost:27017/payload-mcp-basic

# MCP Plugin
MCP_API_KEY=your-secret-api-key-here

# Payload
PAYLOAD_SECRET=your-payload-secret-key
```

3. **Start the development server:**

```bash
npm run dev
```

4. **Access the admin panel:**

Visit `http://localhost:3000/admin` to create your first user and add some content.

## Generated MCP Tools

With this configuration, the following tools will be generated:

- `posts_list` - List all posts with filtering and pagination
- `posts_get` - Get a single post by ID
- `users_list` - List all users with filtering and pagination  
- `users_get` - Get a single user by ID

## Testing the MCP Server

Test the MCP endpoint:

```bash
# Check server status
curl -H "Authorization: Bearer your-api-key" \
     http://localhost:3000/plugin/mcp

# List posts
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
           "limit": 5,
           "where": {
             "status": {
               "equals": "published"
             }
           }
         }
       }
     }' \
     http://localhost:3000/plugin/mcp
```

## Claude Desktop Integration

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "payload-basic": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-sse",
        "http://localhost:3000/plugin/mcp?api_key=your-api-key"
      ]
    }
  }
}
```

## Next Steps

- Try the [advanced configuration example](../advanced-config/) for more complex setups
- Explore [per-collection configuration](../advanced-config/payload.config.ts) options
- Learn about [deployment to Vercel](../vercel/)