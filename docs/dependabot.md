# Dependabot Configuration

Dependabot is configured to automatically create pull requests for dependency updates.

## Schedule

- **Interval**: Weekly (Mondays at 09:00 UTC)
- **Open PRs**: Maximum of 10 pull requests at a time

## Package Ecosystems

### npm

Monitors all `package.json` files in the root directory with the following grouping strategy:

| Group | Packages | Purpose |
|-------|----------|---------|
| `stellar` | `@stellar/*` | Stellar SDK packages |
| `react` | `react`, `react-dom`, `@types/react*` | React ecosystem |
| `testing` | `vitest`, `@testing-library/*`, `jsdom` | Testing framework |
| `eslint` | `eslint`, `@typescript-eslint/*` | Linting and TypeScript |
| `format` | `prettier`, `@prettier/*` | Code formatting |
| `changesets` | `@changesets/*` | Release management |
| `semantic-release` | `semantic-release`, `@semantic-release/*` | Automated releases |
| `docs` | `typedoc`, `vitepress` | Documentation generation |
| `storybook` | `@storybook/*` | Component documentation |
| `dev` | All other dev dependencies | Fallback group |

### GitHub Actions

Monitors all workflow files in `.github/workflows/` with grouped updates for all actions.

## Labels

Pull requests are automatically labeled:

- `dependencies` - All dependency updates
- `npm` - npm dependency updates
- `github-actions` - GitHub Actions updates

## Update Types

- **Minor and patch updates** are grouped and automatically created
- **Major updates** require manual review (not grouped by default)
- **Dev dependencies** are prioritized for automatic updates

## Manual Triggers

You can manually trigger a Dependabot check by:

1. Going to the **Insights** tab
2. Clicking **Dependency graph**
3. Clicking **Dependabot** in the sidebar
4. Clicking **Check for updates**

Or by commenting `/dependabot update` on an open PR.

## Troubleshooting

### No updates created

- Wait 24 hours after configuration for first run
- Check **Actions** tab for workflow status
- Verify `dependabot.yml` syntax is valid

### Too many PRs

- Increase `open-pull-requests-limit` in config
- Add more specific patterns to exclude certain packages

### Conflicting PRs

- Merge or close older PRs first
- Dependabot creates new PRs only after previous ones are resolved

## Security

Dependabot automatically creates security updates for vulnerabilities:
- Priority: Highest (creates PR within hours)
- Grouping: Security updates are separate from regular updates
- Auto-merge: Can be enabled for low-risk packages
