/**
 * @file useSorobanEventFilter.ts
 * @description Hook for saving, naming and reusing Soroban event-filter presets
 * across components, so a contract/topic combination is defined once.
 * @package stellar-hooks
 * @license MIT
 */

import { useCallback, useMemo, useReducer } from "react";

/** A named filter for {@link useSorobanEvents}. */
export interface SorobanEventFilterPreset {
  /** Stable identifier used to select or remove the preset. */
  id: string;
  /** Human-readable name shown in a picker. */
  label: string;
  /** Contract address the preset targets. Omit to match events from any contract. */
  contractId?: string;
  /** Topic filters, as the array-of-arrays `useSorobanEvents` expects. */
  topics?: string[][];
  /** Event type filter. Defaults to `"contract"` when the preset is applied. */
  type?: "system" | "contract" | "diagnostic";
}

export interface UseSorobanEventFilterOptions {
  /** Presets the hook starts with. */
  initialPresets?: SorobanEventFilterPreset[];
  /** Id of the preset to select initially. Defaults to the first preset, if any. */
  initialPresetId?: string;
  /**
   * Where to persist presets. Only `localStorage` and `sessionStorage` are
   * accepted; pass `null` to keep them in memory for the session only, which is
   * the default so the hook never writes storage unless asked.
   */
  storage?: "local" | "session" | null;
  /** Storage key used when persistence is enabled. */
  storageKey?: string;
  /** Called whenever the preset list changes. */
  onChange?: (presets: SorobanEventFilterPreset[]) => void;
}

export interface UseSorobanEventFilterReturn {
  /** Every saved preset, in insertion order. */
  presets: SorobanEventFilterPreset[];
  /** The currently selected preset, or null when none is selected. */
  selected: SorobanEventFilterPreset | null;
  /** The selected preset shaped for `useSorobanEvents`, or null when none is selected. */
  activeFilter: {
    contractId?: string;
    topics?: string[][];
    type?: "system" | "contract" | "diagnostic";
  } | null;
  /**
   * Save a preset. An existing preset with the same id is replaced in place,
   * so this doubles as the edit path and the order stays stable.
   */
  save: (preset: SorobanEventFilterPreset) => void;
  /** Remove a preset by id. Removing the selected preset clears the selection. */
  remove: (id: string) => void;
  /** Select a preset by id, or pass null to clear the selection. */
  select: (id: string | null) => void;
  /** Replace every preset at once. */
  replaceAll: (presets: SorobanEventFilterPreset[]) => void;
}

interface FilterState {
  presets: SorobanEventFilterPreset[];
  selectedId: string | null;
}

type Action =
  | { kind: "save"; preset: SorobanEventFilterPreset }
  | { kind: "remove"; id: string }
  | { kind: "select"; id: string | null }
  | { kind: "replaceAll"; presets: SorobanEventFilterPreset[] };

function reducer(state: FilterState, action: Action): FilterState {
  switch (action.kind) {
    case "save": {
      const index = state.presets.findIndex((p) => p.id === action.preset.id);
      const presets =
        index === -1
          ? [...state.presets, action.preset]
          : state.presets.map((p, i) => (i === index ? action.preset : p));
      return { presets, selectedId: state.selectedId ?? action.preset.id };
    }
    case "remove": {
      const presets = state.presets.filter((p) => p.id !== action.id);
      const selectedId =
        state.selectedId === action.id
          ? (presets[0]?.id ?? null)
          : state.selectedId;
      return { presets, selectedId };
    }
    case "select":
      return { ...state, selectedId: action.id };
    case "replaceAll":
      return {
        presets: action.presets,
        selectedId: action.presets.some((p) => p.id === state.selectedId)
          ? state.selectedId
          : (action.presets[0]?.id ?? null),
      };
    default:
      return state;
  }
}

/** Guard an id so a stored preset cannot reference a different contract. */
function isPreset(value: unknown): value is SorobanEventFilterPreset {
  if (typeof value !== "object" || value === null) return false;
  if (!("id" in value) || !("label" in value)) return false;
  return (
    typeof (value as { id: unknown }).id === "string" &&
    typeof (value as { label: unknown }).label === "string"
  );
}

function readStored(
  storage: "local" | "session" | null,
  key: string,
): SorobanEventFilterPreset[] | null {
  if (!storage || typeof window === "undefined") return null;
  try {
    const raw = (storage === "local" ? window.localStorage : window.sessionStorage)
      .getItem(key);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isPreset) : null;
  } catch {
    // A blocked or full store must not break the page; fall back to memory.
    return null;
  }
}

function writeStored(
  storage: "local" | "session" | null,
  key: string,
  presets: SorobanEventFilterPreset[],
): void {
  if (!storage || typeof window === "undefined") return;
  try {
    (storage === "local" ? window.localStorage : window.sessionStorage)
      .setItem(key, JSON.stringify(presets));
  } catch {
    // Storage can be unavailable in private mode or over quota; the in-memory
    // list is still correct, so this is not an error the caller must handle.
  }
}

/**
 * Save and reuse named Soroban event-filter presets.
 *
 * The hook produces the `activeFilter` from its return value, which can be
 * spread straight into {@link useSorobanEvents}:
 *
 * @example
 * ```tsx
 * const { presets, activeFilter, select } = useSorobanEventFilter({
 *   initialPresets: [
 *     { id: "transfers", label: "Transfers", contractId: "C...", topics: [["transfer"]] },
 *   ],
 *   storage: "local",
 *   storageKey: "my-app:soroban-filters",
 * });
 *
 * const events = useSorobanEvents({ ...activeFilter, limit: 50 });
 *
 * return presets.map((p) => (
 *   <button key={p.id} onClick={() => select(p.id)}>{p.label}</button>
 * ));
 * ```
 */
export function useSorobanEventFilter(
  options: UseSorobanEventFilterOptions = {},
): UseSorobanEventFilterReturn {
  const {
    initialPresets = [],
    initialPresetId,
    storage = null,
    storageKey = "stellar-hooks:soroban-event-filters",
    onChange,
  } = options;

  const [state, dispatch] = useReducer(reducer, undefined, () => {
    const stored = readStored(storage, storageKey);
    const presets = stored ?? initialPresets;
    const selectedId =
      initialPresetId && presets.some((p) => p.id === initialPresetId)
        ? initialPresetId
        : (presets[0]?.id ?? null);
    return { presets, selectedId };
  });

  const persist = useCallback(
    (presets: SorobanEventFilterPreset[]) => {
      writeStored(storage, storageKey, presets);
      onChange?.(presets);
    },
    [storage, storageKey, onChange],
  );

  const save = useCallback(
    (preset: SorobanEventFilterPreset) => {
      dispatch({ kind: "save", preset });
      const index = state.presets.findIndex((p) => p.id === preset.id);
      const next =
        index === -1
          ? [...state.presets, preset]
          : state.presets.map((p, i) => (i === index ? preset : p));
      persist(next);
    },
    [state.presets, persist],
  );

  const remove = useCallback(
    (id: string) => {
      dispatch({ kind: "remove", id });
      persist(state.presets.filter((p) => p.id !== id));
    },
    [state.presets, persist],
  );

  const select = useCallback((id: string | null) => {
    dispatch({ kind: "select", id });
  }, []);

  const replaceAll = useCallback(
    (presets: SorobanEventFilterPreset[]) => {
      dispatch({ kind: "replaceAll", presets });
      persist(presets);
    },
    [persist],
  );

  const selected = useMemo(
    () => state.presets.find((p) => p.id === state.selectedId) ?? null,
    [state.presets, state.selectedId],
  );

  const activeFilter = useMemo(() => {
    if (!selected) return null;
    return {
      contractId: selected.contractId,
      topics: selected.topics,
      type: selected.type ?? "contract",
    };
  }, [selected]);

  return {
    presets: state.presets,
    selected,
    activeFilter,
    save,
    remove,
    select,
    replaceAll,
  };
}
