'use client';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useSyncExternalStore } from 'react';

/** SSR-safe media query (false on the server / first paint). */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (cb: () => void) => {
      const m = window.matchMedia(query);
      m.addEventListener('change', cb);
      return () => m.removeEventListener('change', cb);
    },
    [query],
  );
  return useSyncExternalStore(subscribe, () => window.matchMedia(query).matches, () => false);
}

/** The shared year (`?viti=`, default = current year). Must render under <Suspense>. */
export function useYear(): [number, (year: number) => void] {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const raw = Number(params.get('viti'));
  const year = Number.isInteger(raw) && raw >= 1900 && raw <= 3000 ? raw : new Date().getFullYear();
  const setYear = useCallback(
    (y: number) => {
      const next = new URLSearchParams(params.toString());
      next.set('viti', String(y));
      router.replace(`${pathname}?${next.toString()}`);
    },
    [params, router, pathname],
  );
  return [year, setYear];
}
