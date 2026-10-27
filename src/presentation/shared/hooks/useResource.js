import { useEffect, useState } from 'react';
// A stable loader identifies each request. Cancellation prevents old results replacing new ones.
export function useResource(loader) {
  const [result, setResult] = useState(null);
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    loader(controller.signal).then(
      (data) => {
        if (!controller.signal.aborted)
          setResult({ loader, version, data, error: null });
      },
      (error) => {
        if (!controller.signal.aborted)
          setResult({ loader, version, data: null, error });
      },
    );
    return () => controller.abort();
  }, [loader, version]);
  const current = result?.loader === loader && result?.version === version;
  return {
    data: current ? result.data : null,
    error: current ? result.error : null,
    loading: !current,
    reload: () => setVersion((value) => value + 1),
  };
}
