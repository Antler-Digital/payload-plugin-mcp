# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

This is `payload-plugin-mcp`, a PayloadCMS plugin that integrates with MCP (Model Context Protocol) to enable AI model communication and context sharing within PayloadCMS applications. It creates an MCP server that automatically generates tools for PayloadCMS collections, allowing AI assistants like Claude Desktop to interact with CMS data.

## Development Commands

### Building & Development
```bash
# Build the plugin (complete build process)
pnpm build

# Development server for testing with example PayloadCMS app
pnpm dev

# Clean build artifacts
pnpm clean

# Prepare for publishing
pnpm prepublishOnly
```

### Testing
```bash
# Run tests
pnpm test

# Run tests once
pnpm test:run

# Run tests with coverage
pnpm test:coverage

# Run tests in watch mode
pnpm test:watch

# Run tests with UI
pnpm test:ui
```

### Code Quality
```bash
# Lint code
pnpm lint

# Lint and fix issues
pnpm lint:fix

# Check bundle size
pnpm size-check
```

### PayloadCMS Development
```bash
# Generate TypeScript types for PayloadCMS
pnpm dev:generate-types

# Generate import maps
pnpm dev:generate-importmap

# Run PayloadCMS CLI commands
pnpm dev:payload [command]
```

### Documentation
```bash
# Run documentation development server
pnpm docs:dev

# Build documentation
pnpm docs:build

# Preview built documentation
pnpm docs:preview
```

## Architecture Overview

### Core Structure
- **Entry Point**: `src/index.ts` - Main plugin export
- **Plugin Core**: `src/lib/mcp-plugin/` - MCP integration logic
- **Types**: `src/types/index.ts` - TypeScript type definitions
- **Development App**: `dev/` - Example PayloadCMS application for testing

### Key Components

#### MCP Plugin (`src/lib/mcp-plugin/index.ts`)
- Main plugin factory that configures PayloadCMS with MCP endpoints
- Adds three endpoints: GET (discovery), POST (MCP protocol), OPTIONS (CORS)
- Automatically adds `mcp-tokens` collection for authentication
- Integrates with PayloadCMS initialization lifecycle

#### MCP Handler (`src/lib/mcp-plugin/mcp.ts`)
- Creates HTTP-based MCP server using `mcp-handler` package
- Generates tools dynamically from PayloadCMS collections and globals
- Handles authentication via API keys and database tokens
- Supports media upload tools with chunking capabilities
- Implements auth context using AsyncLocalStorage

#### Authentication System
- Supports environment variable API keys (`MCP_API_KEY`)
- Database-backed tokens with scopes and expiration
- Three token types: admin, service, user (with different default permissions)
- Scope-based authorization (e.g., `collections:*:*`, `media:upload`, `mcp:describe`)

#### Tool Generation
- Automatically creates CRUD tools for each exposed collection/global
- Supports per-collection operation configuration (list, get, create, update, delete)
- Generates JSON schemas from PayloadCMS field definitions
- Handles rich text truncation and media upload strategies

### Configuration Patterns

The plugin supports three configuration patterns:

1. **Simple**: `collections: 'all'` - Exposes all collections with default operations
2. **Array**: Direct collection imports with shared settings
3. **Advanced**: Per-collection configuration with custom operations and metadata

### Transport Strategy
Uses HTTP transport instead of SSE for better serverless compatibility and simpler architecture. The MCP server is stateless and works well with Vercel/Netlify deployments.

## Development Environment

### Requirements
- Node.js 18.20.2+ or 20.9.0+ or 22.0.0+
- pnpm package manager
- MongoDB (for development, uses memory server in tests)

### Environment Variables
```bash
# Required: MCP API key for authentication
MCP_API_KEY=your-secret-api-key

# Optional: Database connection (dev uses memory server)
DATABASE_URI=mongodb://localhost:27017/payload-mcp-dev

# Optional: PayloadCMS secret
PAYLOAD_SECRET=your-payload-secret
```

### Testing Setup
- Uses Vitest as test runner
- MongoDB memory server for isolated tests
- Test setup in `src/test/setup.ts`
- Timeout: 30 seconds for both hooks and tests

### Build System
- TypeScript compilation with type declarations
- SWC for JavaScript transpilation
- Bundles both ESM exports and type definitions
- Size limits: 50KB for main bundle, 10KB for types

## Working with the Plugin

### Key Files to Understand
- `src/lib/mcp-plugin/mcp.ts` - Core MCP server logic and tool registration
- `src/lib/mcp-plugin/utils/tool-generator.ts` - Tool generation from PayloadCMS collections
- `src/lib/mcp-plugin/utils/get-collections-to-expose.ts` - Collection filtering and analysis
- `src/lib/mcp-plugin/collections/index.ts` - MCP tokens collection definition

### Common Development Tasks
1. **Adding new tool operations**: Extend `ToolOperation` type and add handlers in tool generator
2. **Modifying authentication**: Update token verification logic in `mcp.ts`
3. **Collection analysis**: Modify field analysis in collection exposure utilities
4. **Media handling**: Update media upload utilities for new file handling features

### Plugin Integration Points
- **PayloadCMS Endpoints**: Adds `/api/plugin/mcp` routes
- **Collections**: Automatically adds `mcp-tokens` collection
- **Initialization**: Hooks into PayloadCMS `onInit` lifecycle
- **Authentication**: Integrates with PayloadCMS auth system via user references

### Semantic Release
Uses conventional commits for automated versioning:
- `feat:` - New features (minor version)
- `fix:` - Bug fixes (patch version)
- `BREAKING CHANGE:` - Breaking changes (major version)
- `docs:`, `style:`, `refactor:`, `test:`, `chore:` - No version bump

Use `pnpm cz` for guided conventional commits.