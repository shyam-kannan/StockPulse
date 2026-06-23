import { useState, useEffect, useRef, useCallback } from 'react';

export function usePolling(fetchFn, intervalMs = null) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const savedFetchFn = useRef(fetchFn);
  const intervalRef = useRef(null);

  useEffect(() => {
    savedFetchFn.current = fetchFn;
  }, [fetchFn]);

  const refetch = useCallback(async () => {
    try {
      setError(null);
      const result = await savedFetchFn.current();
      setData(result);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();

    if (intervalMs) {
      intervalRef.current = setInterval(refetch, intervalMs);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [intervalMs, refetch]);

  return { data, loading, error, refetch };
}
