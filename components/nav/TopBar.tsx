'use client';

import { usePathname } from 'next/navigation';
import { signOut } from '@/auth';
import UserMenu from './UserMenu';

function PageTitle() {
  const pathname = usePathname();

  const segments: { label: string; muted?: boolean }[] = [
    { label: 'CoreMatch', muted: true },
  ];

  if (pathname.startsWith('/jobs') && pathname !== '/jobs') {
    segments.push({ label: 'Jobs' });
    if (pathname.includes('/rubric')) segments.push({ label: 'Rubric' });
    else if (pathname.includes('/candidates')) segments.push({ label: 'Candidates' });
  } else if (pathname === '/jobs') {
    segments.push({ label: 'Jobs' });
  } else if (pathname.startsWith('/candidates')) {
    segments.push({ label: 'All Candidates' });
  } else if (pathname.startsWith('/admin')) {
    segments.push({ label: 'Admin' });
    if (pathname.includes('/users')) segments.push({ label: 'Users' });
  } else if (pathname.startsWith('/profile')) {
    segments.push({ label: 'Profile' });
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      {segments.map((seg, i) => (
        <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {i > 0 && <span style={{ color: '#d4d4d8', fontSize: 13 }}>/</span>}
          <span style={{
            fontFamily: 'var(--font-space)',
            fontWeight: i === segments.length - 1 ? 600 : 400,
            fontSize: 14,
            color: i === segments.length - 1 ? '#18181b' : '#a1a1aa',
            letterSpacing: '-.01em',
          }}>
            {seg.label}
          </span>
        </span>
      ))}
    </div>
  );
}

export default function TopBar({
  userName,
  initials,
  email,
  onSignOut,
}: {
  userName: string;
  initials: string;
  email: string;
  onSignOut: () => Promise<void>;
}) {
  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0,
      height: 52,
      zIndex: 40,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px 0 88px',
      background: 'rgba(255,255,255,.88)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid #ececed',
    }}>
      <PageTitle />

      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: '#71717a', fontFamily: 'var(--font-mono)' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 0 2.5px #d1fae5', flexShrink: 0 }} />
          AI Engine
        </div>
        <UserMenu
          userName={userName}
          initials={initials}
          email={email}
          onSignOut={onSignOut}
        />
      </div>
    </div>
  );
}
