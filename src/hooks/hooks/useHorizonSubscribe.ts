import { useEffect, useRef } from "react";

export interface HorizonSubscription<T> {
  onmessage: (event: T) => void;
  onerror?: (error: unknown) => void;
  close: () => void;
}

export interface UseHorizonSubscribeOptions<T> {
  subscribe: (
    onMessage: (event: T) => void,
    onError?: (error: unknown) => void,
  ) => HorizonSubscription<T>;
  onMessage: (event: T) => void;
  onError?: (error: unknown) => void;
  enabled?: boolean;
}

export function useHorizonSubscribe<T>({
  subscribe,
  onMessage,
  onError,
  enabled = true,
}: UseHorizonSubscribeOptions<T>): void {
  const subscriptionRef = useRef<HorizonSubscription<T> | null>(null);

  const onMessageRef = useRef(onMessage);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const subscription = subscribe(
      (event) => {
        onMessageRef.current(event);
      },
      (error) => {
        onErrorRef.current?.(error);
      },
    );

    subscriptionRef.current = subscription;

    return () => {
      subscription.close();

      if (subscriptionRef.current === subscription) {
        subscriptionRef.current = null;
      }
    };
  }, [subscribe, enabled]);
}
