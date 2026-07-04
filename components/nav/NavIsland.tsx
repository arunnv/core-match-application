'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

type Props = {
  isAdmin: boolean;
  initials: string;
};

function Tooltip({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ position: 'relative', display: 'flex' }}>
      {children}
      <span style={{
        pointerEvents: 'none',
        position: 'absolute',
        left: 'calc(100% + 12px)',
        top: '50%',
        transform: 'translateY(-50%) scale(.92)',
        transformOrigin: 'left center',
        whiteSpace: 'nowrap',
        background: '#18181b',
        color: '#fff',
        fontFamily: 'var(--font-mono)',
        fontSize: 11,
        padding: '5px 10px',
        borderRadius: 8,
        opacity: 0,
        transition: 'opacity .15s, transform .15s',
        zIndex: 100,
      }}
        className="nav-tooltip"
      >
        {label}
        <span style={{
          position: 'absolute',
          right: '100%',
          top: '50%',
          transform: 'translateY(-50%)',
          border: '5px solid transparent',
          borderRightColor: '#18181b',
        }} />
      </span>
      <style>{`.nav-tip-wrap:hover .nav-tooltip, div:hover > .nav-tooltip { opacity: 1; transform: translateY(-50%) scale(1); }`}</style>
    </div>
  );
}

const NAV_ITEMS = [
  {
    href: '/jobs',
    label: 'Jobs Dashboard',
    icon: (
      <svg width="19" height="19" viewBox="0 0 20 20" fill="none">
        <rect x="2.5" y="6" width="15" height="10.6" rx="2" stroke="currentColor" strokeWidth="1.6" />
        <path d="M7 6V4.7A1.7 1.7 0 0 1 8.7 3h2.6A1.7 1.7 0 0 1 13 4.7V6" stroke="currentColor" strokeWidth="1.6" />
        <path d="M2.6 10.4h14.8" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    ),
  },
  {
    href: '/candidates',
    label: 'All Candidates',
    icon: (
      <svg width="19" height="19" viewBox="0 0 20 20" fill="none">
        <circle cx="7.5" cy="6.5" r="2.5" stroke="currentColor" strokeWidth="1.6" />
        <path d="M2.5 16.5c0-2.2 2.2-4 5-4s5 1.8 5 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <circle cx="14" cy="7" r="2" stroke="currentColor" strokeWidth="1.5" />
        <path d="M14 12.5c2 .5 3 1.5 3 2.8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
];

const ADMIN_ITEM = {
  href: '/admin',
  label: 'Admin Panel',
  icon: (
    <svg width="19" height="19" viewBox="0 0 20 20" fill="none">
      <rect x="3" y="6" width="14" height="11" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M6.5 6V4.3A1.5 1.5 0 0 1 8 2.8h4A1.5 1.5 0 0 1 13.5 4.3V6" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="10" cy="11.5" r="1.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  ),
};

const Divider = () => (
  <div style={{ width: 22, height: 1, background: '#e4e4e7', margin: '2px 0' }} />
);

export default function NavIsland({ isAdmin, initials }: Props) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/jobs') return pathname === '/jobs' || (pathname.startsWith('/jobs/') && !pathname.includes('admin'));
    return pathname.startsWith(href);
  };

  const navBtn = (active: boolean) => ({
    width: 42,
    height: 42,
    border: 'none',
    borderRadius: 14,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: active ? '#18181b' : 'transparent',
    color: active ? '#fff' : '#a1a1aa',
    transition: 'all .2s',
    textDecoration: 'none',
  } as React.CSSProperties);

  return (
    <div style={{
      position: 'fixed',
      left: 16,
      top: '50%',
      transform: 'translateY(-50%)',
      zIndex: 50,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 4,
      padding: '10px 8px',
      background: '#ffffff',
      border: '1px solid #e4e4e7',
      borderRadius: 20,
      boxShadow: '0 12px 32px -12px rgba(24,24,27,.2), 0 2px 6px -2px rgba(24,24,27,.06)',
    }}>

      {/* Logo mark */}
      <Tooltip label="CoreMatch">
        <Link href="/jobs" style={{
          width: 38, height: 38, borderRadius: 13,
          background: '#18181b',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          textDecoration: 'none', flexShrink: 0,
        }}>
          <div style={{ width: 13, height: 13, background: '#10b981', transform: 'rotate(45deg)', borderRadius: 2 }} />
        </Link>
      </Tooltip>

      <Divider />

      {/* Primary nav */}
      {NAV_ITEMS.map((item) => (
        <Tooltip key={item.href} label={item.label}>
          <Link href={item.href} style={navBtn(isActive(item.href))}>
            {item.icon}
          </Link>
        </Tooltip>
      ))}

      <Divider />

      {/* Admin — only for admins, at the bottom before profile */}
      {isAdmin && (
        <Tooltip label={ADMIN_ITEM.label}>
          <Link href={ADMIN_ITEM.href} style={navBtn(isActive(ADMIN_ITEM.href))}>
            {ADMIN_ITEM.icon}
          </Link>
        </Tooltip>
      )}

      {/* Profile — replaces the dead settings button */}
      <Tooltip label="My Profile">
        <Link href="/profile" style={{
          ...navBtn(isActive('/profile')),
          ...(isActive('/profile') ? {} : {
            background: '#f4f4f5',
            color: '#18181b',
          }),
          width: 38,
          height: 38,
          borderRadius: '50%',
          fontFamily: 'var(--font-space)',
          fontWeight: 700,
          fontSize: 12,
        }}>
          {initials}
        </Link>
      </Tooltip>

    </div>
  );
}
