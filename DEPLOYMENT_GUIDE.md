# Deployment and Publishing Guide

This guide covers the complete process of publishing and maintaining the PayloadCMS MCP Plugin on npm.

## 📋 Pre-Publishing Checklist

Before publishing to npm, ensure all of these items are completed:

### ✅ Code Quality
- [ ] All tests pass (`pnpm test:run`)
- [ ] Linting passes (`pnpm lint`)
- [ ] Type checking passes (`pnpm tsc --noEmit`)
- [ ] Bundle size is within limits (`pnpm size-check`)
- [ ] Build completes successfully (`pnpm build`)

### ✅ Documentation
- [ ] README.md is comprehensive and up-to-date
- [ ] CHANGELOG.md includes all changes
- [ ] API documentation is complete
- [ ] Examples are working and tested
- [ ] Installation instructions are clear

### ✅ Package Configuration
- [ ] package.json version is correct
- [ ] Keywords are optimized for discoverability
- [ ] Files array includes all necessary files
- [ ] Peer dependencies are correctly specified
- [ ] License is included

### ✅ Security
- [ ] No sensitive data in repository
- [ ] API keys are properly documented
- [ ] Security audit passes (`pnpm audit`)
- [ ] Dependencies are up-to-date

## 🚀 Publishing Process

### 1. Prepare Release

```bash
# Ensure you're on the main branch
git checkout main
git pull origin main

# Install dependencies
pnpm install

# Run full test suite
pnpm test:run
pnpm lint
pnpm build
```

### 2. Version Management (Using Changesets)

The project uses [Changesets](https://github.com/changesets/changesets) for version management:

```bash
# Add a changeset (describes your changes)
pnpm changeset

# Version packages (updates package.json and CHANGELOG.md)
pnpm changeset:version

# Publish to npm (done automatically by CI)
pnpm release
```

### 3. Manual Publishing (if needed)

If you need to publish manually:

```bash
# Login to npm
npm login

# Build and publish
pnpm build
npm publish --access public
```

### 4. Create GitHub Release

After publishing to npm:

```bash
# Tag the release
git tag v1.0.0
git push origin v1.0.0
```

The GitHub Actions workflow will automatically create a release.

## 🔄 Automated CI/CD Pipeline

The project includes comprehensive GitHub Actions workflows:

### Main CI/CD Workflow (`.github/workflows/ci-cd.yml`)

**Triggers:** Push to main/develop, PRs
**Jobs:**
- **Test**: Runs on Node.js 18, 20, 22
  - Type checking
  - Linting
  - Unit tests
  - Coverage reporting
  - Bundle size checking
- **Build**: Creates distribution files
- **Release**: Publishes to npm (main branch only)

### Security Workflow (`.github/workflows/security.yml`)

**Triggers:** Push, PR, daily schedule
**Jobs:**
- **Audit**: Security vulnerability scanning
- **CodeQL**: Static analysis for security issues

### Documentation Workflow (`.github/workflows/docs.yml`)

**Triggers:** Changes to docs or README
**Jobs:**
- **Build**: Builds VitePress documentation
- **Deploy**: Deploys to GitHub Pages

### Release Workflow (`.github/workflows/release.yml`)

**Triggers:** Git tags (v*.*.*)
**Jobs:**
- **Release**: Creates GitHub release with changelog
- **Notify**: Creates announcement issue

## 🔧 Required GitHub Secrets

Set up these secrets in your GitHub repository:

| Secret | Description | Required |
|--------|-------------|----------|
| `NPM_TOKEN` | npm authentication token | Yes |
| `PAT_TOKEN` | GitHub Personal Access Token | Optional |
| `CHANGESETS_TOKEN` | Token for changeset bot | Optional |

### Creating npm Token

1. Login to [npmjs.com](https://www.npmjs.com)
2. Go to Access Tokens → Generate New Token
3. Select "Automation" type
4. Copy token and add to GitHub secrets

## 📊 Monitoring and Maintenance

### Bundle Size Monitoring

The project uses `size-limit` to monitor bundle size:

```bash
# Check current bundle size
pnpm size-check

# Update size limits in size-limit.config.js if needed
```

### Dependency Updates

Regular dependency maintenance:

```bash
# Check for outdated dependencies
pnpm outdated

# Update dependencies
pnpm update

# Update major versions carefully
pnpm add package@latest
```

### Security Monitoring

- **Automated**: GitHub Dependabot and security advisories
- **Manual**: Run `pnpm audit` regularly
- **CodeQL**: Automated static analysis

## 🏷️ Versioning Strategy

The project follows [Semantic Versioning](https://semver.org/):

- **MAJOR** (1.0.0): Breaking changes
- **MINOR** (0.1.0): New features (backward compatible)
- **PATCH** (0.0.1): Bug fixes (backward compatible)

### Changeset Types

When creating changesets:

- `major`: Breaking changes
- `minor`: New features
- `patch`: Bug fixes, documentation updates

Example changeset:

```markdown
---
"payload-plugin-mcp": minor
---

Add support for custom tool descriptions per collection
```

## 🔍 Quality Assurance

### Pre-commit Hooks

Consider adding pre-commit hooks:

```bash
# Install husky
pnpm add -D husky

# Set up pre-commit hook
npx husky add .husky/pre-commit "pnpm lint && pnpm test:run"
```

### Code Review Process

1. **All changes** require pull requests
2. **At least one approval** before merging
3. **CI must pass** before merging
4. **Branch protection** rules enforce this

### Testing Strategy

- **Unit Tests**: Core functionality
- **Integration Tests**: Plugin integration with Payload
- **E2E Tests**: Full workflow testing
- **Manual Testing**: Real-world scenarios

## 📈 Post-Release Tasks

After each release:

1. **Monitor npm downloads** and usage statistics
2. **Check for issues** in GitHub issues
3. **Update documentation** if needed
4. **Announce release** in community channels
5. **Plan next release** based on feedback

## 🆘 Troubleshooting

### Common Publishing Issues

**Build Fails:**
```bash
# Clean and rebuild
pnpm clean
pnpm build
```

**npm Publish Fails:**
```bash
# Check authentication
npm whoami

# Check package name availability
npm info payload-plugin-mcp
```

**CI/CD Fails:**
- Check GitHub secrets are set correctly
- Verify workflow permissions
- Review error logs in Actions tab

### Rollback Procedure

If a release has critical issues:

```bash
# Deprecate the problematic version
npm deprecate payload-plugin-mcp@1.0.1 "Critical bug, use 1.0.2+"

# Publish a patch version with fixes
pnpm changeset
# Select patch, describe the fix
pnpm changeset:version
pnpm release
```

## 🎯 Best Practices

### Release Management
- **Test thoroughly** before releasing
- **Use semantic versioning** consistently
- **Write clear changelogs**
- **Deprecate old versions** when necessary

### Community Management
- **Respond promptly** to issues
- **Welcome contributions** with clear guidelines
- **Maintain backward compatibility** when possible
- **Communicate changes** clearly

### Code Quality
- **Maintain test coverage** above 80%
- **Keep dependencies updated**
- **Follow TypeScript best practices**
- **Document public APIs** thoroughly

This deployment guide ensures a professional, maintainable release process for your PayloadCMS MCP Plugin.