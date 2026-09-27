import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  warnDeprecated,
  hasWarned,
  resetDeprecationWarnings,
} from "../utils/deprecation";

describe("warnDeprecated utility", () => {
  beforeEach(() => {
    resetDeprecationWarnings();
    vi.restoreAllMocks();
  });

  it("logs a formatted deprecation warning to console.warn", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});

    warnDeprecated("testFeature", "Use newFeature instead.");

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(
      '[stellar-hooks] Deprecation warning: "testFeature" is deprecated and will be removed in a future release. Use newFeature instead.'
    );
    expect(hasWarned("testFeature")).toBe(true);
  });

  it("includes target removal version when provided", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});

    warnDeprecated("oldOption", "Migrate to modernOption.", { version: "1.0.0" });

    expect(spy).toHaveBeenCalledWith(
      '[stellar-hooks] Deprecation warning: "oldOption" is deprecated and will be removed in v1.0.0. Migrate to modernOption.'
    );
  });

  it("deduplicates multiple warnings for the same feature", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});

    warnDeprecated("repeatedFeature", "Migration note.");
    warnDeprecated("repeatedFeature", "Migration note.");
    warnDeprecated("repeatedFeature", "Migration note.");

    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("allows multiple warnings when once: false is specified", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});

    warnDeprecated("multiFeature", "Migration note.", { once: false });
    warnDeprecated("multiFeature", "Migration note.", { once: false });

    expect(spy).toHaveBeenCalledTimes(2);
  });

  it("resets tracked warnings via resetDeprecationWarnings", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});

    warnDeprecated("resettableFeature", "Migration note.");
    expect(hasWarned("resettableFeature")).toBe(true);

    resetDeprecationWarnings();
    expect(hasWarned("resettableFeature")).toBe(false);

    warnDeprecated("resettableFeature", "Migration note.");
    expect(spy).toHaveBeenCalledTimes(2);
  });
});
