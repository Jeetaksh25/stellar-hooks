# Branch Protection Rules

To ensure code quality and prevent broken builds from being merged, the following required status checks are enforced on the `main` branch.

## Required Status Checks

All CI jobs must pass before a pull request can be merged:

### Lint & Type-check
- `CI/Lint & Type-check (Node 18)`
- `CI/Lint & Type-check (Node 20)`
- `CI/Lint & Type-check (Node 22)`

### Tests
- `CI/Test (React 18)` (Node 18, 20, 22)
- `CI/Test (React 19)` (Node 18, 20, 22)

### Bundle Size
- `CI/Bundle size (Node 18)`
- `CI/Bundle size (Node 20)`
- `CI/Bundle size (Node 22)`

### Integration Tests
- `Testnet nightly integration/Testnet live integration`

## Setup Instructions

### GitHub Repository Settings

1. Navigate to your repository on GitHub
2. Go to **Settings** > **Branches**
3. Click **Add rule** or **Edit** for existing main branch rule
4. Configure the following:

#### Required Status Checks
- Check **Require status checks to pass before merging**
- Select **Require all critical checks to pass before merging**
- Add these contexts:
  - `CI/Lint & Type-check (Node 18)`
  - `CI/Lint & Type-check (Node 20)`
  - `CI/Lint & Type-check (Node 22)`
  - `CI/Test (React 18)`
  - `CI/Test (React 19)`
  - `CI/Bundle size (Node 18)`
  - `CI/Bundle size (Node 20)`
  - `CI/Bundle size (Node 22)`
  - `Testnet nightly integration/Testnet live integration`

#### Branch Protection Options
- ✅ Include administrators
- ✅ Require pull request review before merging
- ✅ Dismiss stale pull request approvals when new commits are pushed
- ✅ Require code owner review
- ✅ Require linear history
- ❌ Allow force pushes (uncheck)
- ❌ Allow deletions (uncheck)

### GitHub CLI (Optional)

You can also configure branch protection using GitHub CLI:

```bash
# Install GitHub CLI if not already installed
# https://cli.github.com/

gh api repos/{owner}/{repo}/branches/main/protection \
  --raw-field 'required_status_checks[strict]=true' \
  --raw-field 'required_status_checks[contexts][]=CI/Lint & Type-check (Node 18)' \
  --raw-field 'required_status_checks[contexts][]=CI/Lint & Type-check (Node 20)' \
  --raw-field 'required_status_checks[contexts][]=CI/Lint & Type-check (Node 22)' \
  --raw-field 'required_status_checks[contexts][]=CI/Test (React 18)' \
  --raw-field 'required_status_checks[contexts][]=CI/Test (React 19)' \
  --raw-field 'required_status_checks[contexts][]=CI/Bundle size (Node 18)' \
  --raw-field 'required_status_checks[contexts][]=CI/Bundle size (Node 20)' \
  --raw-field 'required_status_checks[contexts][]=CI/Bundle size (Node 22)' \
  --raw-field 'required_status_checks[contexts][]=Testnet nightly integration/Testnet live integration' \
  --raw-field 'required_pull_request_reviews[dismiss_stale_reviews]=true' \
  --raw-field 'required_pull_request_reviews[require_code_owner_reviews]=true' \
  --raw-field 'required_pull_request_reviews[required_reviewers]=1' \
  --raw-field 'enforce_admins=true' \
  --raw-field 'required_linear_history=true' \
  --raw-field 'allow_force_pushes=false' \
  --raw-field 'allow_deletions=false'
```

## Benefits

- **No broken builds**: All tests must pass before merging
- **Code quality**: Linting and type checking enforced across all Node versions
- **Cross-version compatibility**: Tests run on React 18 and 19
- **Bundle size monitoring**: Size checks prevent unexpected growth
- **Upstream change detection**: Nightly testnet tests catch Horizon/RPC breaking changes early

## Troubleshooting

### Status check not showing up

- Wait a few minutes for GitHub to process the workflow run
- Check that the workflow file is in `.github/workflows/`
- Ensure the job names match exactly what's configured in required status checks

### All checks passing but merge blocked

- Check if the PR is up to date with the latest main branch
- Verify all required reviewers have approved the PR
- Ensure conversation resolution is complete if enabled
