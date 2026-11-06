'use client';
import { PrayerGrid } from '@/components/PrayerGrid';
import { PublicShell } from '@/components/Shell';

export default function Home() {
  return (
    <PublicShell>
      <div className="container">
        <br />
        <h1>Kohët e namazit</h1>
        <br />
        <PrayerGrid />
      </div>
    </PublicShell>
  );
}
