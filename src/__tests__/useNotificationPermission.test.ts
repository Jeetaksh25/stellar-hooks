/**
 * @file useNotificationPermission.test.ts
 * @description Tests for the Notification permission wrapper (#951).
 * @package stellar-hooks
 * @license MIT
 */

import { describe, it, expect, vi, afterEach, type Mock } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useNotificationPermission } from "../hooks/useNotificationPermission";

/** A stand-in for the browser Notification constructor used in these tests. */
interface FakeNotification {
  permission: NotificationPermission;
  requestPermission: Mock;
}

const originalNotification = (
  globalThis as { Notification?: unknown }
).Notification;

function install(
  permission: NotificationPermission,
  behaviour?: () => Promise<NotificationPermission>,
): FakeNotification {
  const fake: FakeNotification = {
    permission,
    requestPermission: vi.fn(behaviour ?? (async () => permission)),
  };
  (globalThis as { Notification?: unknown }).Notification = fake;
  return fake;
}

describe("useNotificationPermission (#951)", () => {
  afterEach(() => {
    (globalThis as { Notification?: unknown }).Notification = originalNotification;
  });

  it("reports unsupported when the Notification API is absent", () => {
    (globalThis as { Notification?: unknown }).Notification = undefined;
    const { result } = renderHook(() => useNotificationPermission());

    expect(result.current.isUnsupported).toBe(true);
    expect(result.current.permission).toBe("unsupported");
    expect(result.current.isGranted).toBe(false);
    expect(result.current.isDefault).toBe(false);
  });

  it("reads the current permission on mount without asking", () => {
    const fake = install("default");
    const { result } = renderHook(() => useNotificationPermission());

    expect(result.current.permission).toBe("default");
    expect(result.current.isDefault).toBe(true);
    expect(result.current.isGranted).toBe(false);
    expect(fake.requestPermission).not.toHaveBeenCalled();
  });

  it("reports granted and denied states distinctly", () => {
    install("granted");
    const granted = renderHook(() => useNotificationPermission());
    expect(granted.result.current.isGranted).toBe(true);
    expect(granted.result.current.isDenied).toBe(false);

    install("denied");
    const denied = renderHook(() => useNotificationPermission());
    expect(denied.result.current.isDenied).toBe(true);
    expect(denied.result.current.isGranted).toBe(false);
  });

  it("updates state and notifies the caller after a request resolves", async () => {
    const fake = install("default", async () => "granted");
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useNotificationPermission({ onPermissionChange: onChange }),
    );

    await act(async () => {
      await result.current.request();
    });

    expect(fake.requestPermission).toHaveBeenCalledTimes(1);
    expect(result.current.permission).toBe("granted");
    expect(result.current.isGranted).toBe(true);
    expect(onChange).toHaveBeenCalledWith("granted");
  });

  it("surfaces a rejected request as an error without inventing a state", async () => {
    const fake = install("default");
    fake.requestPermission.mockRejectedValue(new Error("user gesture required"));
    const { result } = renderHook(() => useNotificationPermission());

    await act(async () => {
      await result.current.request();
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe("user gesture required");
    // The browser still reports default, so the hook must not claim granted.
    expect(result.current.permission).toBe("default");
    expect(result.current.isRequesting).toBe(false);
  });

  it("exposes an in-flight request through isRequesting", async () => {
    let release: ((value: NotificationPermission) => void) | undefined;
    const pending = new Promise<NotificationPermission>((resolve) => {
      release = resolve;
    });
    const fake = install("default");
    fake.requestPermission.mockReturnValue(pending);

    const { result } = renderHook(() => useNotificationPermission());

    let inFlight: Promise<NotificationPermission> | undefined;
    act(() => {
      inFlight = result.current.request();
    });
    await waitFor(() => expect(result.current.isRequesting).toBe(true));

    await act(async () => {
      release?.("granted");
      await inFlight;
    });

    expect(result.current.isRequesting).toBe(false);
    expect(result.current.isGranted).toBe(true);
  });

  it("does not call requestPermission on mount unless asked", async () => {
    const fake = install("default");
    renderHook(() => useNotificationPermission());
    expect(fake.requestPermission).not.toHaveBeenCalled();

    await act(async () => {
      renderHook(() => useNotificationPermission({ requestOnMount: true }));
    });
    await waitFor(() => expect(fake.requestPermission).toHaveBeenCalledTimes(1));
  });
});
