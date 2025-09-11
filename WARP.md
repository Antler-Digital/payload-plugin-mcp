# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

This is **payload-plugin-mcp**, a comprehensive PayloadCMS plugin that creates a Model Context Protocol (MCP) server compatible with Claude Desktop and other AI assistants. It automatically generates MCP tools for PayloadCMS collections and provides both embedded and standalone server options.

## Development Commands

### Package Management
```bash
# Install dependencies (preferred)
pnpm install

# Alternative package managers
npm install
yarn install
```

### Build Commands
```bash
# Full build process
pnpm build

# Individual build steps
pnpm build:types        # Generate TypeScript types
pnpm build:swc         # Compile with SWC
pnpm copyfiles         # Copy static assets

# Clean build artifacts
pnpm clean
```

### Development Server
```bash
# Start development server with hot reload
pnpm dev

# Start development server with Turbo
next dev dev --turbo
```

### Testing
```bash
# Run tests in watch mode
pnpm test

# Run tests once
pnpm test:run

# Run tests with coverage
pnpm test:coverage

# Run tests with UI
pnpm test:ui
```

### Code Quality
```bash
# Lint code
pnpm lint

# Lint and auto-fix
pnpm lint:fix

# Check bundle size
pnpm size-check
```

### Documentation
```bash
# Start documentation dev server
pnpm docs:dev

# Build documentation
pnpm docs:build

# Preview built documentation
pnpm docs:preview
```

### Development Utilities
```bash
# Generate import map for dev environment
pnpm dev:generate-importmap

# Generate TypeScript types for dev
pnpm dev:generate-types
```

## Architecture Overview

### Plugin Structure
- **Main Plugin Entry**: `src/lib/mcp-plugin/index.ts` - The core PayloadCMS plugin that integrates MCP server functionality
- **Types System**: `src/types/index.ts` and `src/lib/mcp-plugin/types/index.ts` - Comprehensive type definitions for MCP tools, collections, and plugin configuration
- **Export Layer**: `src/exports/index.ts` - Public API exports for plugin consumers

### Key Components
- **MCP Server**: `src/lib/mcp-plugin/mcp.ts` - HTTP-based MCP protocol implementation
- **Tool Generation**: `src/lib/mcp-plugin/utils/tool-generator.ts` - Automatic generation of CRUD tools from PayloadCMS collections
- **Authentication**: `src/lib/mcp-plugin/auth-context.ts` - API key and token-based authentication system
- **Collections Integration**: `src/lib/mcp-plugin/utils/get-collections-to-expose.ts` - Smart collection discovery and configuration

### Transport Architecture
The plugin uses **HTTP transport** over Server-Sent Events (SSE) for several reasons:
- **Serverless Compatibility**: Works seamlessly with Vercel, Netlify, and other serverless platforms
- **Stateless Design**: Fits PayloadCMS architecture patterns
- **CRUD Optimization**: More efficient for typical CMS operations
- **Debugging Simplicity**: Easier to troubleshoot HTTP requests/responses

### Collection Tool Generation
The plugin automatically generates MCP tools based on PayloadCMS collection schemas:
1. **Schema Analysis**: Analyzes collection fields, relationships, and constraints
2. **JSON Schema Generation**: Creates rich input/output schemas using `zod-schema.ts`
3. **Operation Mapping**: Maps CRUD operations (list, get, create, update, delete) to MCP tools
4. **Permission Integration**: Respects PayloadCMS access control patterns

## Configuration Patterns

### Basic Setup
```typescript
PayloadPluginMcp({
  apiKey: process.env.MCP_API_KEY,
  collections: 'all', // Expose all collections
  defaultOperations: {
    list: true,
    get: true,
    create: false,
    update: false,
    delete: false,
  },
})
```

### Advanced Collection Configuration
```typescript
PayloadPluginMcp({
  apiKey: process.env.MCP_API_KEY,
  collections: [
    // Direct collection reference
    Posts,
    
    // Collection with custom options
    {
      collection: Users,
      options: {
        operations: { list: true, get: true, create: true, update: true },
        toolPrefix: 'user',
        description: 'user management',
        excludeFields: ['password'], // Hide sensitive fields
      },
    },
  ],
})
```

## Development Environment Setup

### Required Environment Variables
```bash
# Required for authentication
MCP_API_KEY=your-secret-api-key-here

# Optional server configuration  
MCP_SERVER_PORT=3001
MCP_SERVER_HOST=0.0.0.0
```

### Development Structure
- **Dev Environment**: `dev/` - Complete PayloadCMS setup for testing the plugin
- **Examples**: `examples/` - Real-world integration examples
- **Documentation**: `docs/` - VitePress documentation site

## Testing Strategy

### Test Configuration
- **Framework**: Vitest with Node.js environment
- **Setup**: `src/test/setup.ts` - Test environment configuration
- **Timeout**: 30 seconds for integration tests
- **Coverage**: V8 coverage provider

### Test Types
- **Unit Tests**: Individual function and utility testing
- **Integration Tests**: Full plugin integration with PayloadCMS
- **E2E Tests**: Playwright tests for complete workflows

## Build System

### Compilation Stack
- **TypeScript**: ES2022 target with Node.js module resolution
- **SWC**: Fast compilation with React support
- **Build Pipeline**: Types → SWC compilation → Asset copying

### Bundle Analysis
- **Size Limits**: Main bundle <50KB (gzipped), Types <10KB
- **Tree Shaking**: ES modules for optimal bundling
- **Multiple Formats**: ESM exports with TypeScript declarations

## Deployment Considerations

### Serverless Optimization
- **Cold Start Mitigation**: Eager initialization of MCP handlers
- **Memory Efficiency**: Lazy loading of non-essential components
- **HTTP Endpoints**: Stateless request handling

### Production Checklist
1. Set secure API key in production environment
2. Configure appropriate collection access controls
3. Enable authentication for public deployments
4. Monitor bundle size impacts on serverless cold starts

## Development Workflow

### Local Development
1. Set up environment variables in `dev/.env`
2. Run `pnpm dev` to start development server
3. Use `pnpm dev:generate-types` after schema changes
4. Test with `curl` or MCP Inspector tool

### Testing Changes
1. Run `pnpm test` for unit/integration tests
2. Use `pnpm test:coverage` to verify test coverage
3. Test with real PayloadCMS collections in `dev/` environment

### Release Process
1. Run `pnpm build` to ensure clean compilation
2. Update version with `pnpm changeset`
3. Publish with `pnpm release`
