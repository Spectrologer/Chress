# GitHub Actions Workflows

This directory contains CI/CD workflows for the Chress project.

## Workflows

### CI Workflow ([ci.yml](ci.yml))

Runs on every push and pull request to `main` and `develop` branches.

**Jobs:**
- **Test**: Runs on Node.js 18.x and 20.x
  - Lints code with ESLint
  - Runs type checking with TypeScript
  - Executes test suite with coverage
  - Uploads coverage reports to Codecov (optional)

- **Build**: Runs after tests pass
  - Builds the production bundle
  - Uploads build artifacts for review
  - Reports build size

### Deploy Workflow ([deploy.yml](deploy.yml))

Automatically deploys to GitHub Pages when code is pushed to `main` branch.

**Jobs:**
- **Build**:
  - Runs tests
  - Builds production bundle
  - Prepares artifacts for GitHub Pages

- **Deploy**:
  - Deploys to GitHub Pages
  - Outputs deployment URL

**Manual Deployment**: This workflow can also be triggered manually from the Actions tab using the "Run workflow" button.

## Setup Requirements

### 1. Enable GitHub Pages

1. Go to your repository Settings > Pages
2. Under "Build and deployment", set:
   - **Source**: GitHub Actions
3. Save the settings

### 2. Optional: Enable Codecov (for coverage reports)

1. Sign up at [codecov.io](https://codecov.io)
2. Add your repository
3. No additional secrets needed - Codecov automatically authenticates GitHub Actions

### 3. Branch Protection (Recommended)

Consider adding branch protection rules for `main`:
1. Go to Settings > Branches
2. Add rule for `main` branch:
   - Require status checks to pass before merging
   - Require branches to be up to date before merging
   - Select the CI status checks (test, build)

## Workflow Status

You can view the status of all workflows at:
`https://github.com/Spectrologer/Chress/actions`

## Badges

Add these badges to your main README.md:

```markdown
![CI](https://github.com/Spectrologer/Chress/workflows/CI/badge.svg)
![Deploy](https://github.com/Spectrologer/Chress/workflows/Deploy%20to%20GitHub%20Pages/badge.svg)
```

## Troubleshooting

### Deploy workflow fails
- Ensure GitHub Pages is enabled in repository settings
- Check that the `pages` environment has proper permissions
- Verify that the `GITHUB_TOKEN` has `pages: write` permission

### CI workflow fails
- Check that all npm scripts exist in package.json
- Verify Node.js version compatibility
- Review the specific failing step in the Actions logs

### Build artifacts are too large
- Review the build size report in the CI workflow
- Consider adjusting the code splitting in vite.config.js
- Check for unintentionally bundled large dependencies
