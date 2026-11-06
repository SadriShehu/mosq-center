'use client';
import { AuthGuard, useMe } from '@/components/AuthGuard';
import { PrayerGrid } from '@/components/PrayerGrid';

function Content() {
  const me = useMe();
  return (
    <div className="container">
      <br />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {me.picture && <img className="avatar" src={me.picture} alt="" />}
      <h2>Miresevini {me.name}</h2>
      <p> Jeni kyqur me sukses </p>
      <hr />
      <h1>Kohët e namazit</h1>
      <br />
      <PrayerGrid authed />
    </div>
  );
}

export default function User() {
  return <AuthGuard><Content /></AuthGuard>;
}
