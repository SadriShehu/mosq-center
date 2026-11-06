'use client';
import { useQuery } from '@tanstack/react-query';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useSyncExternalStore } from 'react';
import { api } from './api';
import { sq } from './sq';

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

/**
 * Tenant brand from GET /api/v1/public/config (one cached fetch per session),
 * falling back to `sq.brand` while loading or on error. Also keeps <title> in sync.
 */
export function useBrand(): string {
  const pathname = usePathname();
  const { data } = useQuery({
    queryKey: ['public', 'config'],
    queryFn: api.publicConfig,
    staleTime: Infinity,
    gcTime: Infinity,
  });
  const brand = data?.brand_name?.trim() || sq.brand;
  useEffect(() => {
    document.title = brand;
  }, [brand, pathname]);
  return brand;
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
