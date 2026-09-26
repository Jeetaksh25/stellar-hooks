# stellar-hooks Roadmap

Welcome to the public roadmap for **stellar-hooks**! This roadmap outlines our planned features, ongoing milestones, and future vision.

We track active development using a public **[GitHub Projects Roadmap Board](https://github.com/dark-princezz/stellar-hooks/projects)**, where open issues and pull requests are grouped by **Milestone** so contributors can easily see what is planned next at a glance.

- 📋 **Public Roadmap Board:** [https://github.com/dark-princezz/stellar-hooks/projects](https://github.com/dark-princezz/stellar-hooks/projects)
- 🎯 **GitHub Milestones:** [https://github.com/dark-princezz/stellar-hooks/milestones](https://github.com/dark-princezz/stellar-hooks/milestones)

---

## Roadmap Board Structure

The public project board organizes work into milestone-based swimlanes and Kanban views:

```
+---------------------------------------------------------------------------------------+
|                               GitHub Projects Board                                   |
|                                                                                       |
|  [ Milestone: v0.3.0 ]       [ Milestone: v0.4.0 ]       [ Milestone: v1.0.0 ]        |
|  Advanced Soroban            Cross-Platform & Streaming   Production Readiness        |
|  --------------------        --------------------------   --------------------        |
|  * useFederation (SEP-2)     * useAnchorTransfer (SEP-6)  * Error Taxonomy Standard   |
|  * useWebAuth (SEP-10)       * useAnchorQuote (SEP-38)    * 100% Critical Test Cov    |
|  * useAllowance              * Streaming (SSE) Variants   * Strict Typings & Maps     |
|  * useContractEvents v2      * React Native / Expo Supp.  * Optimistic Updates Preset |
+---------------------------------------------------------------------------------------+
```

Within each milestone, tasks move across standard flow columns:
1. **Backlog** — Scoped and approved issues awaiting assignment.
2. **Ready for Dev** — Fully specified issues ready for community contributors.
3. **In Progress** — Actively being developed in a feature branch.
4. **In Review** — Pull Request open and undergoing code review.
5. **Done** — Merged into `main` and included in the upcoming release.

---

## Milestones Overview

### Milestone: `v0.3.0` — Advanced Soroban & Ecosystem Integrations (Current Active)
Target: Near-term minor release focusing on SEP protocol expansions and enhanced Soroban primitives.

- [ ] **`useFederation()`** — SEP-2 federated address resolution (converting `user*stellar.org` into account keys and memos)
- [ ] **`useWebAuth()`** — SEP-10 challenge/response cryptographic authentication for Soroban and Horizon dApps
- [ ] **`useAllowance()`** — Soroban token allowance inspection, approval, and revocation management
- [ ] **`useContractEvents()` v2** — Enhanced Soroban RPC polling with filter predicates and paging cursor persistence
- [ ] **Soroban Simulation Helpers** — Pre-flight simulation cost estimation and authorization entry inspection

---

### Milestone: `v0.4.0` — Cross-Platform & Streaming Support
Target: Mid-term minor release focusing on off-chain/on-chain bridges, real-time data, and mobile.

- [ ] **`useAnchorTransfer()`** — SEP-6 / SEP-24 interactive deposit and withdrawal flows with Stellar Anchors
- [ ] **`useAnchorQuote()`** — SEP-38 firm quotes for cross-border asset conversions
- [ ] **Streaming (SSE) Variants** — Real-time Server-Sent Events hooks for account balances, operations, and transaction effects (`useStreamEffects`, `useStreamPayments`)
- [ ] **React Native / Expo Compatibility** — Adapter layer enabling wallet connection hooks in mobile React Native environments
- [ ] **WalletConnect v2 Enhancements** — Auto-reconnection, pairing uri QR codes, and multi-session persistence

---

### Milestone: `v1.0.0` — Production Readiness & Enterprise Hardening
Target: Major release marking stable long-term API commitments and full production readiness.

- [ ] **Standardized Error Taxonomy** — Universal `StellarTransactionError` error types across all wallet and transaction hooks
- [ ] **100% Critical Path Test Coverage** — Complete unit, integration, and mocked test suites for all build/sign/submit flows
- [ ] **Full Declaration Maps & Strict TypeScript** — Seamless Go-to-Definition editor navigation and zero `any` types in public APIs
- [ ] **Offline Fallback & Optimistic Cache Layer** — Configurable caching and optimistic UI updates for high-throughput dApps

---

### Future / Backlog Explorations
Items undergoing exploratory design and research:

- [ ] **Hardware Wallet Support** — Direct Ledger wallet connection via WebUSB / WebHID
- [ ] **Passkey / WebAuthn Signer Adapter** — Native Soroban passkey account signers without external extension requirements
- [ ] **Automated Fee Bump Acceleration** — Transparent fee bump transaction wrappers for stuck transactions

---

## How to Get Involved

1. **Pick an Issue:** Check the **[Public Roadmap Board](https://github.com/dark-princezz/stellar-hooks/projects)** or browse the current milestone. Look for issues with the `good first issue` or `help wanted` tags.
2. **Comment on the Issue:** Leave a comment expressing your interest so maintainers can assign it to you and update the board status to `In Progress`.
3. **Follow the Contributing Guide:** Review [CONTRIBUTING.md](CONTRIBUTING.md) for branch naming, testing, and conventional commit rules.
4. **Propose New Roadmap Items:** Have an idea? Submit a [Feature Request](https://github.com/dark-princezz/stellar-hooks/issues/new?template=feature_request.md). Accepted proposals are assigned to the appropriate milestone board.
