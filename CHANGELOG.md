## [1.1.8](https://github.com/Antler-Digital/payload-plugin-mcp/compare/v1.1.7...v1.1.8) (2025-10-06)

### Bug Fixes

* reorder type generation step in CI/CD workflow ([84e49d8](https://github.com/Antler-Digital/payload-plugin-mcp/commit/84e49d8c4c52f00d9f858188a3bcf0791d29ee66))
* update package.json to reference built files in the dist directory ([e785b90](https://github.com/Antler-Digital/payload-plugin-mcp/commit/e785b90afd7d0b95efd06130516a9b412d96f371))

## [1.1.7](https://github.com/Antler-Digital/payload-plugin-mcp/compare/v1.1.6...v1.1.7) (2025-10-06)

### Bug Fixes

* simplify publishConfig in package.json by removing unnecessary exports and main fields ([2a61fc0](https://github.com/Antler-Digital/payload-plugin-mcp/commit/2a61fc0cb01c4cf66454630f535f9313695db1c9))

## [1.1.6](https://github.com/Antler-Digital/payload-plugin-mcp/compare/v1.1.5...v1.1.6) (2025-10-06)

### Bug Fixes

* publishconfig update ([85af0c4](https://github.com/Antler-Digital/payload-plugin-mcp/commit/85af0c4c9ebc2a2a0d2a097d306ef19876f56893))
* update package.json to reference built files in dist directory ([425ff67](https://github.com/Antler-Digital/payload-plugin-mcp/commit/425ff67e286663cd5004ca6240fdec6c958a30e9))

## [1.1.5](https://github.com/Antler-Digital/payload-plugin-mcp/compare/v1.1.4...v1.1.5) (2025-10-02)

### Bug Fixes

* revert tsconfig.build.json ([c705cc7](https://github.com/Antler-Digital/payload-plugin-mcp/commit/c705cc760ea3c82406dd0d2c69a8a3a4e9d18936))

## [1.1.4](https://github.com/Antler-Digital/payload-plugin-mcp/compare/v1.1.3...v1.1.4) (2025-10-02)

### Bug Fixes

* remove pnpm clean as it removes declarations ([f7eb5ef](https://github.com/Antler-Digital/payload-plugin-mcp/commit/f7eb5ef6c15cc8563f893dfba582eaa06595c6a3))

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
