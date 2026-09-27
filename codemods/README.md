# Automated Codemods

This directory contains automated migration transforms powered by [`jscodeshift`](https://github.com/facebook/jscodeshift) to help developers upgrade their applications across breaking releases of `stellar-hooks`.

---

## Available Codemods

### v0.2.0: `use-account-merge`

Migrates pre-v0.2.0 `useAccountMerge()` usage to the modern options + `submit()` pattern.

#### Example Transformation

**Before:**
```tsx
import { useAccountMerge } from "stellar-hooks";

function CloseAccountButton() {
  const { merge, status, error } = useAccountMerge();

  const handleMerge = async () => {
    await merge("GDESTINATION...", { confirm: true, memo: "closing" });
  };

  return <button onClick={handleMerge}>Close Account</button>;
}
```

**After:**
```tsx
import { useAccountMerge } from "stellar-hooks";

function CloseAccountButton() {
  const { submit, status, error } = useAccountMerge({
    destination: "GDESTINATION...",
    memo: "closing",
  });

  const handleMerge = async () => {
    await submit();
  };

  return <button onClick={handleMerge}>Close Account</button>;
}
```

---

## How to Run

You can execute the codemod directly against your codebase using `npx jscodeshift`:

```bash
# Run against your source directory
npx jscodeshift -t ./node_modules/stellar-hooks/codemods/v0.2.0/use-account-merge.js src/ --extensions=ts,tsx,js,jsx --parser=tsx
```

Or from within the `stellar-hooks` repository:

```bash
npm run codemod:v0.2.0 -- <path-to-target-files>
```

### Options

- `--dry`: Dry run (no changes written to disk).
- `--print`: Print transformed output to stdout.
- `--extensions=ts,tsx,js,jsx`: Ensure TypeScript and JSX files are processed.
- `--parser=tsx`: Parse TypeScript and JSX syntax cleanly.
