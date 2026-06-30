import { useEffect } from 'react';

export function useTitle(page: string) {
  useEffect(() => { document.title = `리걸리 — ${page}`; }, [page]);
}
