# Testnet Integration Tests

Live integration tests against Stellar public Testnet.

These tests hit real Horizon and Soroban RPC endpoints to catch upstream breaking changes early. They are **opt-in** and run via the nightly CI workflow or manually.

## Usage

```bash
# Run all testnet integration tests
npm run test:testnet

# Run specific test file
npm run test:testnet tests/integration/testnet/network.test.ts
```

## Environment

- **Horizon URL**: `https://horizon-testnet.stellar.org`
- **Soroban RPC URL**: `https://soroban-testnet.stellar.org`
- **Network Passphrase**: `Test SDF Network ; September 2015`

## Schedule

This suite runs automatically at 2:00 AM UTC daily via `.github/workflows/testnet-nightly.yml`.

## Manual Trigger

You can manually run the workflow from the GitHub UI:
1. Navigate to the Actions tab
2. Select "Testnet nightly integration"
3. Click "Run workflow" → "Run workflow"
