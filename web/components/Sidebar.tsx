'use client';
import Link from 'next/link';

export function Sidebar({ links }: { links: { href: string; label: string }[] }) {
  return (
    <div className="border-end bg-white" id="sidebar-wrapper">
      <div
        className="sidebar-heading border-bottom bg-light"
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/favicon.ico" alt="Logo" height={60} />
        <span>Xhamia Qender</span>
      </div>
      <div className="list-group list-group-flush">
        {links.map((l) => (
          <Link key={l.href} className="list-group-item list-group-item-action list-group-item-light p-3" href={l.href}>
            {l.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
