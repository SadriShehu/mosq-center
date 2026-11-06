'use client';
import { faMoon, faSun, type IconDefinition } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Prayers } from '@/lib/types';
import { errMsg } from './Toast';

const ITEMS: { label: string; key: keyof Prayers; icon: IconDefinition; wide?: boolean }[] = [
  { label: 'Sabahu', key: 'Fajr', icon: faMoon },
  { label: 'Lindja e Diellit', key: 'Sunrise', icon: faSun },
  { label: 'Dreka', key: 'Dhuhr', icon: faSun },
  { label: 'Ikindia', key: 'Asr', icon: faSun },
  { label: 'Akshami', key: 'Maghrib', icon: faMoon },
  { label: 'Jacia', key: 'Isha', icon: faMoon },
  { label: 'Pjesa e tretë e natës', key: 'Midnight', icon: faMoon, wide: true },
];

const boxStyle = {
  border: '1px solid #ccc', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  padding: 10, borderRadius: 10, textAlign: 'center' as const,
};

/** Seven prayer-time cards. `authed` picks /prayers (session) vs /public/prayers. */
export function PrayerGrid({ authed = false }: { authed?: boolean }) {
  const { data, error } = useQuery({
    queryKey: ['prayers', authed],
    queryFn: authed ? api.prayers : api.publicPrayers,
  });
  if (error) return <p className="text-danger">{errMsg(error)}</p>;
  return (
    <div className="container">
      <div className="row">
        {ITEMS.map((it) => (
          <div key={it.key} className={`${it.wide ? 'col-md-12' : 'col-md-4'} mb-4`}>
            <div className="prayer-box" style={boxStyle}>
              <FontAwesomeIcon icon={it.icon} style={{ fontSize: 24, paddingBottom: 5 }} />
              <p className="prayer-time" style={{ paddingTop: 5, marginBottom: 0 }}>
                {it.label}: {data ? data[it.key] : ''}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
