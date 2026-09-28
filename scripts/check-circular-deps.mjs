#!/usr/bin/env node
/**
 * @file check-circular-deps.mjs
 * @description Circular dependency checker for stellar-hooks.
 *
 * Uses `madge` (https://github.com/pahen/madge) to build a dependency graph of
 * the source tree and report any cycles.  Circular imports are a bundling hazard:
 *  - They can cause variables to be `undefined` at module initialisation time.
 *  - They prevent tree-shakers from safely dropping dead code.
 *  - They make it hard to reason about initialisation order.
 *
 * Issue: #837 — Audit circular dependency risk between hook modules
 *
 * Usage:
 *   node scripts/check-circular-deps.mjs            # exit 0 = no cycles
 *   node scripts/check-circular-deps.mjs --warn     # report cycles but don't fail
 *   node scripts/check-circular-deps.mjs --graph    # also write dep graph to dep-graph.json
 *
 * Add to CI:
 *   "check:circular": "node scripts/check-circular-deps.mjs"
 *
 * @license MIT
 */

import { createRequire } from "module";
import { writeFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

// ─── Flags ────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const WARN_ONLY = args.includes("--warn");
const WRITE_GRAPH = args.includes("--graph");

const SRC_DIR = path.resolve(__dirname, "../src");
const GRAPH_OUTPUT = path.resolve(__dirname, "../dep-graph.json");

// ─── Main ─────────────────────────────────────────────────────────────────────

async function run() {
  let madge;
  try {
    // `madge` is a devDependency — if it isn't installed, give a clear message.
    madge = (await import("madge")).default;
  } catch {
    // Fallback: try to find madge via the local node_modules path resolution
    try {
      const { createRequire } = await import("module");
      const localRequire = createRequire(path.resolve(__dirname, "../package.json"));
      madge = localRequire("madge");
    } catch {
      console.error(
        "[check-circular-deps] madge is not installed.\n" +
          "Run: npm install --save-dev madge\n" +
          "Or:  npx madge --circular --extensions ts,tsx src/",
      );
      process.exit(1);
    }
  }

  console.log(`[check-circular-deps] Scanning ${SRC_DIR} …\n`);

  const result = await madge(SRC_DIR, {
    fileExtensions: ["ts", "tsx"],
    tsConfig: path.resolve(__dirname, "../tsconfig.json"),
    // Exclude test and story files — they frequently import from multiple
    // layers and are not shipped in the package bundle.
    excludeRegExp: [
      /\.test\.(ts|tsx)$/,
      /\.test-d\.(ts|tsx)$/,
      /\.stories\.(ts|tsx)$/,
      /__tests__/,
      /__mocks__/,
    ],
  });

  const circular = result.circular();

  // ── Optional: write full dependency graph ──────────────────────────────────
  if (WRITE_GRAPH) {
    const graph = result.obj();
    writeFileSync(GRAPH_OUTPUT, JSON.stringify(graph, null, 2), "utf-8");
    console.log(`[check-circular-deps] Dependency graph written to ${GRAPH_OUTPUT}\n`);
  }

  // ── Report ─────────────────────────────────────────────────────────────────
  if (circular.length === 0) {
    console.log("✅  No circular dependencies found.");
    process.exit(0);
  }

  const label = circular.length === 1 ? "cycle" : "cycles";
  const icon = WARN_ONLY ? "⚠️ " : "❌ ";
  console.log(`${icon} Found ${circular.length} circular ${label}:\n`);

  for (let i = 0; i < circular.length; i++) {
    const chain = circular[i];
    // Format: "src/a.ts → src/b.ts → src/a.ts" (loop back is implied)
    console.log(
      `  ${i + 1}) ${chain.join(" → ")} → ${chain[0]}`,
    );
  }

  console.log("");
  console.log("─── How to break a cycle ─────────────────────────────────────────────────────");
  console.log("  1. Extract the shared type/value into a dedicated low-level module that");
  console.log("     both files can import without creating a loop.");
  console.log("  2. Convert type-only imports to `import type { … }` — TypeScript erases");
  console.log("     these at runtime so they cannot cause initialisation-order issues");
  console.log("     (though madge still flags them).");
  console.log("  3. Introduce a dependency-injection pattern (pass a factory function)");
  console.log("     so the dependent module does not need a static import.");
  console.log("──────────────────────────────────────────────────────────────────────────────\n");

  if (WARN_ONLY) {
    console.log("Continuing (--warn mode).");
    process.exit(0);
  }

  process.exit(1);
}

run().catch((err) => {
  console.error("[check-circular-deps] Unexpected error:", err);
  process.exit(1);
});
