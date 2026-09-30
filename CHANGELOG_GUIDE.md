# CHANGELOG Entry Format Guide

This document defines the expected format for CHANGELOG entries in `stellar-hooks`. All updates to [`CHANGELOG.md`](CHANGELOG.md) must follow [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) standards and adhere to [Semantic Versioning](https://semver.org/) as documented in [`SEMVER.md`](SEMVER.md).

For full documentation and online preview, see [`docs/guides/changelog-format-guide.md`](docs/guides/changelog-format-guide.md).

---

## Key Principles

- **Human-Centric**: Write descriptions from the perspective of an application developer using `stellar-hooks`.
- **Categorized**: Place entries under standard subheadings (`Added`, `Changed`, `Deprecated`, `Removed`, `Fixed`, `Security`).
- **Traceable**: Link to related GitHub pull requests and issues.
- **Breaking Changes Highlighted**: Mark breaking changes with bold `**Breaking:**` prefixes and update [`MIGRATION.md`](MIGRATION.md).

---

## Standard Entry Categories

- `### Added` — for new features, hooks, props, or options.
- `### Changed` — for modifications in existing behavior or interfaces.
- `### Deprecated` — for features marked for removal in future versions.
- `### Removed` — for features or deprecated code that was permanently removed.
- `### Fixed` — for bug fixes, edge-case resolutions, and error handling repairs.
- `### Security` — for vulnerability remediations or security disclosures.

---



```markdown
### <Category>
- `<hookOrModule>` — <concise description of what changed> ([#<PR_ID>](https://github.com/dark-princezz/stellar-hooks/pull/<PR_ID>))
```

### Breaking Change Example

```markdown
### Changed
- **Breaking:** `useAccountMerge` now returns `{ submit, status, ... }` action API instead of executing on mount. See [MIGRATION.md](MIGRATION.md). ([#78](https://github.com/dark-princezz/stellar-hooks/pull/78))
```
