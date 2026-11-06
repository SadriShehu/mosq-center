'use client';
import { AuthGuard } from '@/components/AuthGuard';
import { sq } from '@/lib/sq';

/** Stub: the collection screen is built in r-mbl. */
export default function Page() {
  return (
    <AuthGuard>
      <h1 className="font-heading text-2xl font-extrabold">{sq.nav.collection}</h1>
    </AuthGuard>
  );
}
