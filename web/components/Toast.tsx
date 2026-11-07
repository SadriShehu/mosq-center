'use client';
import { Toaster, toast } from 'sonner';
import type { ReactNode } from 'react';
import { sq } from '@/lib/sq';

export interface ToastApi {
  success: (m: string) => void;
  error: (m: string) => void;
  info: (m: string) => void;
}

const api: ToastApi = {
  success: (m) => void toast.success(m),
  error: (m) => void toast.error(m),
  info: (m) => void toast(m),
};

/** Renders the (aria-live) toaster. Mounted once in the root layout via Providers. */
export function ToastProvider({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <Toaster position="top-center" richColors closeButton duration={5000} />
    </>
  );
}

export function useToast(): ToastApi {
  return api;
}

/** Message with a "Zhbëj" action. Default 6 s as required for one-click payments. */
export function toastUndo(message: string, onUndo: () => void | Promise<void>, durationMs = 6000) {
  return toast.success(message, {
    duration: durationMs,
    action: { label: sq.actions.undo, onClick: () => void onUndo() },
  });
}

/** Already-Albanian ApiError messages pass through; anything else gets the generic text. */
export function errMsg(e: unknown): string {
  return e instanceof Error && e.name === 'ApiError' ? e.message : sq.errors.unknown;
}
