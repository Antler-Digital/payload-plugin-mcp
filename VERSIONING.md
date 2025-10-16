# Automated Versioning with Semantic Release

This project uses [Semantic Release](https://github.com/semantic-release/semantic-release) for automated version management and publishing. This ensures that:

- Version numbers are managed automatically based on conventional commits
- Changelogs are generated automatically
- Releases are published to npm automatically
- Git tags are created automatically

## How It Works

The project uses conventional commits to determine version bumps:

- `feat:` → minor version bump
- `fix:` → patch version bump
- `perf:` → patch version bump
- `refactor:` → patch version bump
- `BREAKING CHANGE:` → major version bump
- `docs:`, `test:`, `chore:`, `ci:`, `build:` → no release

## Release Process

The release process is fully automated via GitHub Actions:

1. **Push to main branch**: When code is pushed to main, the CI/CD workflow runs
2. **Conventional commit analysis**: Semantic release analyzes commit messages
3. **Automatic release**: If changes warrant a release, it will:
   - Update version numbers in `package.json`
   - Generate/update `CHANGELOG.md`
   - Create a git tag
   - Publish to npm
   - Create a GitHub release

## Usage Examples

### Adding a New Feature

```bash
git commit -m "feat: add new MCP tool for media upload"
git push
```

### Fixing a Bug

```bash
git commit -m "fix: resolve authentication issue in MCP handler"
git push
```

### Breaking Change

```bash
git commit -m "feat!: redesign MCP plugin API

BREAKING CHANGE: The MCP plugin configuration has changed significantly"
git push
```

## Important Notes

1. **Use conventional commits** for all changes that should trigger releases
2. **Don't manually edit** `package.json` version - let semantic-release handle it
3. **Follow conventional commit format**: `type(scope): description`
4. **Internal changes** (like updating dev dependencies) use `chore:` type
5. **Multiple commits** can be batched into a single release

## Commit Types

- `feat:` - New features (minor version)
- `fix:` - Bug fixes (patch version)
- `perf:` - Performance improvements (patch version)
- `refactor:` - Code refactoring (patch version)
- `docs:` - Documentation changes (no release)
- `test:` - Test changes (no release)
- `chore:` - Maintenance tasks (no release)
- `ci:` - CI/CD changes (no release)
- `build:` - Build system changes (no release)

## Troubleshooting

### Release not happening

- Check that commits follow conventional commit format
- Ensure changes are pushed to the main branch
- Verify the CI/CD workflow is running successfully

### Wrong version bump

- Review your commit messages to ensure they use the correct type
- Check the semantic-release configuration in `.releaserc.json`

## Verification

Check that semantic-release is working:

- ✅ Semantic-release configured in `.releaserc.json`
- ✅ GitHub Actions workflow in place
- ✅ Automated publishing enabled
- ✅ Conventional commits being used

The next time you want to release, just use conventional commits and push your changes!
