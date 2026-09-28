/**
 * @file renderHookWithProvider.tsx
 * @description Test helper wrapping @testing-library/react renderHook with StellarProvider.
 * @package stellar-hooks
 * @license MIT
 */

import React from "react";
import { renderHook, type RenderHookOptions, type RenderHookResult } from "@testing-library/react";
import { StellarProvider } from "../context";
import type { StellarProviderProps } from "../types";

export interface RenderHookWithProviderOptions<Props>
  extends Omit<RenderHookOptions<Props>, "wrapper"> {
  /** Optional props forwarded to the wrapping StellarProvider (defaults to testnet). */
  providerProps?: Omit<StellarProviderProps, "children">;
  /** Optional inner wrapper component composed inside StellarProvider. */
  wrapper?: React.ComponentType<{ children: React.ReactNode }>;
}

/**
 * Renders a hook automatically wrapped in `<StellarProvider>`, eliminating
 * provider boilerplate in unit and integration test suites.
 */
export function renderHookWithProvider<Result, Props = undefined>(
  render: (initialProps: Props) => Result,
  options: RenderHookWithProviderOptions<Props> = {}
): RenderHookResult<Result, Props> {
  const { providerProps, wrapper: InnerWrapper, ...renderOptions } = options;

  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <StellarProvider {...providerProps}>
      {InnerWrapper ? <InnerWrapper>{children}</InnerWrapper> : children}
    </StellarProvider>
  );

  return renderHook(render, {
    ...renderOptions,
    wrapper: Wrapper,
  });
}
