---
"stellar-hooks": minor
---

- Define SemVer policy and breaking-change criteria in `SEMVER.md`
- Add standardized deprecation warnings (`warnDeprecated`) ahead of removing legacy hook options and signatures
- Maintain compatibility matrix for `@stellar/stellar-sdk` versions in `COMPATIBILITY.md`
- Add automated `jscodeshift` codemod for migrating `useAccountMerge` from pre-v0.2.0 API to options pattern
