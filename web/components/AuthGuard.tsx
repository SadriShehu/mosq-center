'use client';
import { useQuery } from '@tanstack/react-query';
import { createContext, useContext, type ReactNode } from 'react';
import { api } from '@/lib/api';
import type { Me } from '@/lib/types';
import { AppShell } from './Shell';

const MeCtx = createContext<Me | null>(null);

/** Current user; only valid under <AuthGuard>. */
export function useMe(): Me {
  const me = useContext(MeCtx);
  if (!me) throw new Error('useMe must be used inside AuthGuard');
  return me;
}

/** Checks /api/v1/me (401 → redirect to /login via the api client), then renders AppShell. */
export function AuthGuard({ children }: { children: ReactNode }) {
  const { data } = useQuery({ queryKey: ['me'], queryFn: api.me, staleTime: 60_000 });
  if (!data) return null;
  return (
    <MeCtx.Provider value={data}>
      <AppShell>{children}</AppShell>
    </MeCtx.Provider>
  );
}
