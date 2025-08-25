# Automated Versioning with Changesets

This project uses [Changesets](https://github.com/changesets/changesets) for automated version management and publishing. This ensures that:

1. **No duplicate versions** are published to npm
2. **Semantic versioning** is followed automatically
3. **Changelog** is generated automatically
4. **Releases** are automated via GitHub Actions

## How It Works

### 1. Making Changes

When you make changes to the codebase that should trigger a new release, you need to create a "changeset" that describes what changed.

### 2. Creating a Changeset

Run this command to create a changeset:

```bash
pnpm changeset
```

This will:
- Ask you what type of change this is (patch, minor, major)
- Ask you to describe the change
- Create a markdown file in `.changeset/` directory

**Change Types:**
- **Patch** (1.0.0 → 1.0.1): Bug fixes, small improvements
- **Minor** (1.0.0 → 1.1.0): New features, backwards compatible
- **Major** (1.0.0 → 2.0.0): Breaking changes

### 3. Committing Changes

Commit your code changes AND the changeset file:

```bash
git add .
git commit -m "feat: add new analytics feature"
git push
```

### 4. Automated Release Process

When you push to the `main` branch, the GitHub Action will:

1. **Check for changesets**: If there are changeset files, it will create a "Release PR"
2. **Release PR**: This PR will:
   - Update the version in `package.json`
   - Update the `CHANGELOG.md`
   - Remove the changeset files
3. **Merge the Release PR**: When you merge this PR, it will automatically publish to npm

## Example Workflow

### Scenario: You fixed a bug

1. Make your code changes
2. Create a changeset:
   ```bash
   pnpm changeset
   ```
   - Select "patch" (bug fix)
   - Describe: "Fix dashboard stats calculation error"
3. Commit and push:
   ```bash
   git add .
   git commit -m "fix: dashboard stats calculation error"
   git push
   ```
4. GitHub Action creates a Release PR
5. Review and merge the Release PR
6. Package is automatically published with new patch version

### Scenario: You added a new feature

1. Make your code changes
2. Create a changeset:
   ```bash
   pnpm changeset
   ```
   - Select "minor" (new feature)
   - Describe: "Add real-time visitor tracking"
3. Commit and push
4. Merge the Release PR when ready
5. Package is published with new minor version

## Manual Commands

If you need to manually manage versions:

```bash
# Create a changeset
pnpm changeset

# Preview what the next version will be
pnpm changeset:version

# Manually publish (not recommended, use GitHub Actions instead)
pnpm release
```

## Important Notes

1. **Always create changesets** for user-facing changes
2. **Don't manually edit** `package.json` version - let changesets handle it
3. **Review Release PRs** carefully before merging
4. **Internal changes** (like updating dev dependencies) don't need changesets
5. **Multiple changesets** can be accumulated before creating a release

## Troubleshooting

### "Version already exists" error
This happens when you manually bump the version. Let changesets handle versioning automatically.

### No Release PR created
Make sure you have changeset files in `.changeset/` directory and they're committed to the main branch.

### GitHub Action fails
Check that you have `NPM_TOKEN` secret set in your GitHub repository settings.

## Current Status

- ✅ Changesets configured
- ✅ GitHub Action set up
- ✅ NPM publishing automated
- ✅ Semantic versioning enforced

The next time you want to release, just create a changeset and push your changes! 