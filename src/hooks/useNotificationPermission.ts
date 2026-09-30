/**
 * @file useNotificationPermission.ts
 * @description Hook wrapping the browser Notification permission flow with an
 * explicit state, so a UI can show whether prompts are granted, denied, or not
 * yet asked for.
 * @package stellar-hooks
 * @license MIT
 */

import { useCallback, useEffect, useMemo, useState } from "react";

/** The permission states the browser reports, plus the no-Notification case. */
export type NotificationPermissionState =
  | NotificationPermission
  | "unsupported";

export interface UseNotificationPermissionOptions {
  /**
   * Ask the browser for permission as soon as the hook mounts. Default: false,
   * because browsers require a user gesture for the prompt and a mount-time
   * request is usually dismissed. Prefer calling `request` from a click.
   */
  requestOnMount?: boolean;
  /** Called after a permission request settles, with the resulting state. */
  onPermissionChange?: (state: NotificationPermissionState) => void;
}

export interface UseNotificationPermissionReturn {
  /** Current permission state, or "unsupported" where the API is missing. */
  permission: NotificationPermissionState;
  /** True when notifications may be shown. */
  isGranted: boolean;
  /** True when the browser reported an explicit denial. */
  isDenied: boolean;
  /** True when the user has not been asked yet. */
  isDefault: boolean;
  /** True when the API is unavailable, for example on an insecure origin. */
  isUnsupported: boolean;
  /** True while a request is in flight. */
  isRequesting: boolean;
  /** The last error a request produced, if any. */
  error: Error | null;
  /**
   * Ask for permission. Call this from a click handler: browsers ignore
   * requests made without a user gesture, and Safari rejects them outright.
   * Resolves with the resulting state.
   */
  request: () => Promise<NotificationPermissionState>;
}

function readPermission(): NotificationPermissionState {
  if (typeof globalThis === "undefined") return "unsupported";
  const api = (globalThis as { Notification?: typeof Notification }).Notification;
  if (!api || typeof api.permission !== "string") return "unsupported";
  return api.permission;
}

/**
 * Wrap the browser Notification permission flow with a state a component can
 * render directly.
 *
 * @example
 * ```tsx
 * const { isGranted, isDenied, isUnsupported, request, isRequesting } =
 *   useNotificationPermission();
 *
 * if (isUnsupported) return null;
 * if (isGranted) return <span>Alerts are on</span>;
 *
 * return (
 *   <button onClick={request} disabled={isRequesting || isDenied}>
 *     {isDenied ? "Alerts are blocked in your browser settings" : "Turn on alerts"}
 *   </button>
 * );
 * ```
 */
export function useNotificationPermission(
  options: UseNotificationPermissionOptions = {},
): UseNotificationPermissionReturn {
  const { requestOnMount = false, onPermissionChange } = options;
  const [permission, setPermission] = useState<NotificationPermissionState>(
    () => readPermission(),
  );
  const [isRequesting, setIsRequesting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Keep the reported state honest when the user changes the setting outside
  // the page. Permissions API notifications are not available in every browser,
  // so fall back to re-reading on window focus.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const refresh = () => {
      const next = readPermission();
      setPermission((current) => (current === next ? current : next));
    };
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, []);

  const request = useCallback(async (): Promise<NotificationPermissionState> => {
    const api = (globalThis as { Notification?: typeof Notification }).Notification;
    if (!api || typeof api.requestPermission !== "function") {
      setPermission("unsupported");
      return "unsupported";
    }

    setIsRequesting(true);
    setError(null);
    try {
      const result = await api.requestPermission();
      setPermission(result);
      onPermissionChange?.(result);
      return result;
    } catch (cause) {
      const failure =
        cause instanceof Error ? cause : new Error(String(cause));
      setError(failure);
      // Safari rejects the request outside a gesture; report the browser's
      // current view rather than inventing one.
      const current = readPermission();
      setPermission(current);
      return current;
    } finally {
      setIsRequesting(false);
    }
  }, [onPermissionChange]);

  useEffect(() => {
    if (!requestOnMount) return;
    void request();
  }, [requestOnMount, request]);

  return useMemo(
    () => ({
      permission,
      isGranted: permission === "granted",
      isDenied: permission === "denied",
      isDefault: permission === "default",
      isUnsupported: permission === "unsupported",
      isRequesting,
      error,
      request,
    }),
    [permission, isRequesting, error, request],
  );
}
