## [1.1.3](https://github.com/Antler-Digital/payload-plugin-mcp/compare/v1.1.2...v1.1.3) (2025-10-02)

## [1.1.2](https://github.com/Antler-Digital/payload-plugin-mcp/compare/v1.1.1...v1.1.2) (2025-10-02)

## [1.1.1](https://github.com/Antler-Digital/payload-plugin-mcp/compare/v1.1.0...v1.1.1) (2025-09-11)

### Bug Fixes

* update TypeScript configuration for build process ([048c271](https://github.com/Antler-Digital/payload-plugin-mcp/commit/048c271337ba546acf7016e82f4a5f202ad34790))

## [1.1.0](https://github.com/Antler-Digital/payload-plugin-mcp/compare/v1.0.0...v1.1.0) (2025-09-11)

### Features

* Enhance post management and routing in Payload CMS ([6f59bc2](https://github.com/Antler-Digital/payload-plugin-mcp/commit/6f59bc2aaf52601df66f98a3dd4b800d88d6561c))
* integrate semantic release for automated versioning and changelog generation ([dabb92f](https://github.com/Antler-Digital/payload-plugin-mcp/commit/dabb92f5b0882dee01429c2e98c50722f7ad2c4b))

### Bug Fixes

* added husky ([edebc9d](https://github.com/Antler-Digital/payload-plugin-mcp/commit/edebc9d60d495282a68597f368c152a870aa88b2))
* enhance semantic release configuration for git assets ([cd5dd7b](https://github.com/Antler-Digital/payload-plugin-mcp/commit/cd5dd7b2e11336d7091f3e7cd681ceaa82f67a00))
* Update package.json and pnpm-lock.yaml for new dependencies and scripts ([9ed09cc](https://github.com/Antler-Digital/payload-plugin-mcp/commit/9ed09cc20567cd18a5e92440130b30de8b4f81d1))

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Comprehensive documentation with VitePress
- Advanced CI/CD workflows with security scanning
- Bundle size monitoring with size-limit
- GitHub issue and PR templates
- Automated release management
- CodeQL security analysis

### Changed
- Improved package.json configuration for npm publishing
- Enhanced TypeScript build configuration
- Updated keywords for better discoverability
- Refined peer dependencies specification

### Fixed
- Build system optimization for proper distribution
- Export paths for both development and production

## [1.0.0] - 2024-01-XX

### Added
- Initial release of PayloadCMS MCP Plugin
- Automatic MCP tool generation for Payload collections
- Support for all CRUD operations (configurable)
- API key authentication
- HTTP and SSE transport support
- Vercel deployment compatibility
- Rich JSON schema generation
- Per-collection operation control
- Custom tool naming and descriptions
- Field exclusion for sensitive data
- Comprehensive test suite
- Development environment setup
- API documentation

### Features
- **Collection Integration**: Seamlessly integrates with existing Payload collections
- **Flexible Configuration**: Support for 'all' collections or specific collection targeting
- **Security**: Built-in API key authentication and access control
- **Performance**: Optimized for serverless environments
- **Developer Experience**: TypeScript support with full type safety
- **Extensibility**: Plugin architecture allows for custom extensions

### Documentation
- Complete README with examples
- API reference documentation
- Troubleshooting guide
- Deployment instructions for Vercel
- Claude Desktop integration guide
