'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const MAIN_ITEMS = [
  {
    href: '/jobs',
    title: 'Global Jobs',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect x="2.5" y="6" width="15" height="10.6" rx="2" stroke="currentColor" strokeWidth="1.6" />
        <path d="M7 6V4.7A1.7 1.7 0 0 1 8.7 3h2.6A1.7 1.7 0 0 1 13 4.7V6" stroke="currentColor" strokeWidth="1.6" />
        <path d="M2.6 10.4h14.8" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    ),
  },
];

const ADMIN_ITEM = {
  href: '/admin',
  title: 'System Control Panel',
  icon: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <rect x="3" y="6" width="14" height="11" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M6.5 6V4.3A1.5 1.5 0 0 1 8 2.8h4A1.5 1.5 0 0 1 13.5 4.3V6" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="10" cy="11.5" r="1.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  ),
};

export default function NavIsland({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/jobs') return pathname === '/jobs' || (pathname.startsWith('/jobs/') && !pathname.includes('admin'));
    return pathname.startsWith(href);
  };

  const navBtn = (active: boolean) =>
    `w-[42px] h-[42px] border-none rounded-[14px] cursor-pointer flex items-center justify-center transition-all duration-200 ${
      active ? 'bg-[#18181b] text-white' : 'bg-transparent text-[#a1a1aa] hover:bg-[#f4f4f5]'
    }`;

  return (
    <div
      style={{
        position: 'fixed',
        left: 24,
        top: '50%',
        transform: 'translateY(-50%)',
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
        padding: '10px 8px',
        background: '#ffffff',
        border: '1px solid #e4e4e7',
        borderRadius: 20,
        boxShadow: '0 12px 32px -12px rgba(24,24,27,.22), 0 2px 6px -2px rgba(24,24,27,.08)',
      }}
    >
      {/* Logo — navigates home */}
      <Link href="/jobs" title="Home" style={{ width: 38, height: 38, borderRadius: 13, background: '#18181b', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 6, textDecoration: 'none' }}>
        <div style={{ width: 13, height: 13, background: '#10b981', transform: 'rotate(45deg)', borderRadius: 2 }} />
      </Link>

      {/* Admin — only visible to admins */}
      {isAdmin && (
        <Link href={ADMIN_ITEM.href} title={ADMIN_ITEM.title} className={navBtn(isActive(ADMIN_ITEM.href))}>
          {ADMIN_ITEM.icon}
        </Link>
      )}

      <div style={{ width: 22, height: 1, background: '#e4e4e7', margin: '4px 0' }} />

      {/* Main nav */}
      {MAIN_ITEMS.map((item) => (
        <Link key={item.href} href={item.href} title={item.title} className={navBtn(isActive(item.href))}>
          {item.icon}
        </Link>
      ))}

      <div style={{ width: 22, height: 1, background: '#e4e4e7', margin: '4px 0' }} />

      {/* Settings */}
      <button title="Settings" className={navBtn(false)}>
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="10" r="3" stroke="currentColor" strokeWidth="1.6" />
          <circle cx="10" cy="10" r="7.2" stroke="currentColor" strokeWidth="1.6" strokeDasharray="2.5 3" />
        </svg>
      </button>
    </div>
  );
}
