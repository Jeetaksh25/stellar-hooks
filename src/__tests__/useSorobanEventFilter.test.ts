/**
 * @file useSorobanEventFilter.test.ts
 * @description Tests for reusable Soroban event-filter presets (#946).
 * @package stellar-hooks
 * @license MIT
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import {
  useSorobanEventFilter,
  type SorobanEventFilterPreset,
} from "../hooks/useSorobanEventFilter";

const TRANSFERS: SorobanEventFilterPreset = {
  id: "transfers",
  label: "Transfers",
  contractId: "CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD2KM",
  topics: [["transfer"]],
};

const ADMIN: SorobanEventFilterPreset = {
  id: "admin",
  label: "Admin calls",
  contractId: "CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD2KM",
  type: "system",
};

describe("useSorobanEventFilter (#946)", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  it("starts empty and exposes no active filter", () => {
    const { result } = renderHook(() => useSorobanEventFilter());

    expect(result.current.presets).toEqual([]);
    expect(result.current.selected).toBeNull();
    expect(result.current.activeFilter).toBeNull();
  });

  it("selects the first initial preset and shapes it for useSorobanEvents", () => {
    const { result } = renderHook(() =>
      useSorobanEventFilter({ initialPresets: [TRANSFERS, ADMIN] }),
    );

    expect(result.current.selected?.id).toBe("transfers");
    expect(result.current.activeFilter).toEqual({
      contractId: TRANSFERS.contractId,
      topics: [["transfer"]],
      type: "contract",
    });
  });

  it("honours an explicit initial preset id", () => {
    const { result } = renderHook(() =>
      useSorobanEventFilter({ initialPresets: [TRANSFERS, ADMIN], initialPresetId: "admin" }),
    );

    expect(result.current.selected?.id).toBe("admin");
    expect(result.current.activeFilter?.type).toBe("system");
  });

  it("saves a preset, selects it, and keeps insertion order", () => {
    const { result } = renderHook(() => useSorobanEventFilter());

    act(() => result.current.save(TRANSFERS));
    act(() => result.current.save(ADMIN));

    expect(result.current.presets.map((p) => p.id)).toEqual(["transfers", "admin"]);
    expect(result.current.selected?.id).toBe("transfers");
  });

  it("replaces a preset in place when the id matches", () => {
    const { result } = renderHook(() =>
      useSorobanEventFilter({ initialPresets: [TRANSFERS, ADMIN] }),
    );

    act(() =>
      result.current.save({ ...TRANSFERS, label: "All transfers", topics: [["transfer", "mint"]] }),
    );

    expect(result.current.presets).toHaveLength(2);
    expect(result.current.presets[0].label).toBe("All transfers");
    expect(result.current.presets[0].topics).toEqual([["transfer", "mint"]]);
  });

  it("moves the selection to the next preset when the selected one is removed", () => {
    const { result } = renderHook(() =>
      useSorobanEventFilter({ initialPresets: [TRANSFERS, ADMIN] }),
    );

    act(() => result.current.remove("transfers"));

    expect(result.current.presets.map((p) => p.id)).toEqual(["admin"]);
    expect(result.current.selected?.id).toBe("admin");
  });

  it("clears the selection when the last preset is removed", () => {
    const { result } = renderHook(() =>
      useSorobanEventFilter({ initialPresets: [TRANSFERS] }),
    );

    act(() => result.current.remove("transfers"));

    expect(result.current.presets).toEqual([]);
    expect(result.current.selected).toBeNull();
    expect(result.current.activeFilter).toBeNull();
  });

  it("clears the active filter when select(null) is called", () => {
    const { result } = renderHook(() =>
      useSorobanEventFilter({ initialPresets: [TRANSFERS] }),
    );

    act(() => result.current.select(null));

    expect(result.current.selected).toBeNull();
    expect(result.current.activeFilter).toBeNull();
    // The preset list is untouched by a deselection.
    expect(result.current.presets).toHaveLength(1);
  });

  it("persists presets and reloads them on a later mount", () => {
    const key = "test:filters";
    const first = renderHook(() =>
      useSorobanEventFilter({ storage: "local", storageKey: key }),
    );

    act(() => first.result.current.save(TRANSFERS));
    act(() => first.result.current.save(ADMIN));

    const second = renderHook(() =>
      useSorobanEventFilter({ storage: "local", storageKey: key }),
    );

    expect(second.result.current.presets.map((p) => p.id)).toEqual(["transfers", "admin"]);
    expect(JSON.parse(window.localStorage.getItem(key) ?? "[]")).toHaveLength(2);
  });

  it("ignores stored records that are not presets", () => {
    const key = "test:junk";
    window.localStorage.setItem(key, JSON.stringify([{ nope: true }, TRANSFERS, 42]));

    const { result } = renderHook(() =>
      useSorobanEventFilter({ storage: "local", storageKey: key }),
    );

    expect(result.current.presets.map((p) => p.id)).toEqual(["transfers"]);
  });

  it("does not write storage when persistence is off", () => {
    const spy = vi.spyOn(window.localStorage, "setItem");
    const { result } = renderHook(() => useSorobanEventFilter());

    act(() => result.current.save(TRANSFERS));

    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it("reports the preset list to the onChange callback", () => {
    const onChange = vi.fn();
    const { result } = renderHook(() => useSorobanEventFilter({ onChange }));

    act(() => result.current.save(TRANSFERS));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0][0].id).toBe("transfers");
  });

  it("replaces every preset and re-selects when the old selection is gone", () => {
    const { result } = renderHook(() =>
      useSorobanEventFilter({ initialPresets: [TRANSFERS, ADMIN] }),
    );
    expect(result.current.selected?.id).toBe("transfers");

    act(() => result.current.replaceAll([ADMIN]));

    // "transfers" no longer exists, so the selection falls back to a preset
    // that is actually in the new list rather than dangling.
    expect(result.current.presets.map((p) => p.id)).toEqual(["admin"]);
    expect(result.current.selected?.id).toBe("admin");
  });

  it("keeps the selection across replaceAll when that preset survives", () => {
    const { result } = renderHook(() =>
      useSorobanEventFilter({ initialPresets: [TRANSFERS, ADMIN], initialPresetId: "admin" }),
    );

    act(() => result.current.replaceAll([TRANSFERS, ADMIN]));

    expect(result.current.presets.map((p) => p.id)).toEqual(["transfers", "admin"]);
    expect(result.current.selected?.id).toBe("admin");
  });
});
