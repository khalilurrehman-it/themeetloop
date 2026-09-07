"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { MeetingApiError } from "@/modules/meetings/services/meetingApiClient";

export interface AsyncResourceState<ResourceValue> {
  value: ResourceValue | null;
  /** True only for the first load, so a background refresh never blanks the page. */
  isInitiallyLoading: boolean;
  isRefreshing: boolean;
  /** Set only when there is nothing to show. A refresh failure surfaces in `refreshError`. */
  loadError: MeetingApiError | Error | null;
  /** Set when a background refresh failed while stale data is still on screen. */
  refreshError: MeetingApiError | Error | null;
  reload: () => Promise<void>;
  refresh: () => Promise<void>;
  setValue: (nextValue: ResourceValue) => void;
}

/**
 * Loads a resource with explicit initial-load, refresh, error and retry states.
 *
 * A failed refresh deliberately keeps the previously loaded value on screen: losing a
 * rendered meeting because one poll failed is worse than showing slightly stale data.
 */
export function useAsyncResource<ResourceValue>(
  loadResource: () => Promise<ResourceValue>,
): AsyncResourceState<ResourceValue> {
  const [value, setValue] = useState<ResourceValue | null>(null);
  const [isInitiallyLoading, setIsInitiallyLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<MeetingApiError | Error | null>(null);
  const [refreshError, setRefreshError] = useState<MeetingApiError | Error | null>(null);

  const isMountedReference = useRef<boolean>(true);
  const hasLoadedOnceReference = useRef<boolean>(false);
  const inFlightRequestReference = useRef<Promise<void> | null>(null);

  useEffect(() => {
    isMountedReference.current = true;
    return () => {
      isMountedReference.current = false;
    };
  }, []);

  const runLoad = useCallback(
    async (isBackgroundRefresh: boolean): Promise<void> => {
      // Collapse overlapping calls so a slow request cannot stack up behind a poll interval.
      if (inFlightRequestReference.current) return inFlightRequestReference.current;

      const request = (async () => {
        if (isBackgroundRefresh && hasLoadedOnceReference.current) setIsRefreshing(true);
        else setIsInitiallyLoading(true);

        try {
          const loadedValue = await loadResource();
          if (!isMountedReference.current) return;
          hasLoadedOnceReference.current = true;
          setValue(loadedValue);
          setLoadError(null);
          setRefreshError(null);
        } catch (caughtError) {
          if (!isMountedReference.current) return;
          const normalizedError =
            caughtError instanceof Error ? caughtError : new Error("Unknown request failure");
          if (hasLoadedOnceReference.current) setRefreshError(normalizedError);
          else setLoadError(normalizedError);
        } finally {
          if (isMountedReference.current) {
            setIsInitiallyLoading(false);
            setIsRefreshing(false);
          }
        }
      })();

      inFlightRequestReference.current = request;
      try {
        await request;
      } finally {
        inFlightRequestReference.current = null;
      }
    },
    [loadResource],
  );

  const reload = useCallback(() => runLoad(false), [runLoad]);
  const refresh = useCallback(() => runLoad(true), [runLoad]);

  useEffect(() => {
    void runLoad(false);
  }, [runLoad]);

  return {
    value,
    isInitiallyLoading,
    isRefreshing,
    loadError,
    refreshError,
    reload,
    refresh,
    setValue,
  };
}
