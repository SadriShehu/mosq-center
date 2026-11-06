'use client';
import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { Toast, ToastContainer } from 'react-bootstrap';

type Variant = 'success' | 'danger' | 'info';
interface Item { id: number; message: string; variant: Variant }
interface ToastApi {
  success: (m: string) => void;
  error: (m: string) => void;
  info: (m: string) => void;
}

const Ctx = createContext<ToastApi | null>(null);
let seq = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Item[]>([]);
  const push = useCallback((message: string, variant: Variant) => {
    setItems((xs) => [...xs, { id: ++seq, message, variant }]);
  }, []);
  const api: ToastApi = {
    success: (m) => push(m, 'success'),
    error: (m) => push(m, 'danger'),
    info: (m) => push(m, 'info'),
  };
  return (
    <Ctx.Provider value={api}>
      {children}
      <ToastContainer position="top-end" className="p-3" style={{ zIndex: 2000, position: 'fixed' }}>
        {items.map((t) => (
          <Toast
            key={t.id}
            bg={t.variant}
            autohide
            delay={5000}
            onClose={() => setItems((xs) => xs.filter((x) => x.id !== t.id))}
          >
            <Toast.Header closeButton>
              <strong className="me-auto">{t.variant === 'danger' ? 'Gabim' : 'Njoftim'}</strong>
            </Toast.Header>
            <Toast.Body className={t.variant === 'info' ? '' : 'text-white'} role="alert">
              {t.message}
            </Toast.Body>
          </Toast>
        ))}
      </ToastContainer>
    </Ctx.Provider>
  );
}

export function useToast(): ToastApi {
  const c = useContext(Ctx);
  if (!c) throw new Error('useToast must be used inside ToastProvider');
  return c;
}

export function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}
