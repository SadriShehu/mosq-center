'use client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/** Old route: client redirect to /mbledhja keeping the query (year → viti). */
export default function Page() {
  const router = useRouter();
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const year = p.get('year');
    if (year && !p.has('viti')) p.set('viti', year);
    p.delete('year');
    const q = p.toString();
    router.replace(q ? `/mbledhja?${q}` : '/mbledhja');
  }, [router]);
  return null;
}
