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

function NavTooltip({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="nav-tip-wrap">
      {children}
      <span className="nav-tip">{label}</span>
      <style>{`
        .nav-tip-wrap { position: relative; display: flex; }
        .nav-tip {
          pointer-events: none;
          position: absolute;
          left: calc(100% + 12px);
          top: 50%;
          transform: translateY(-50%) scale(.92);
          transform-origin: left center;
          white-space: nowrap;
          background: #18181b;
          color: #fff;
          font-family: var(--font-mono);
          font-size: 11px;
          padding: 5px 10px;
          border-radius: 8px;
          opacity: 0;
          transition: opacity .15s, transform .15s;
          z-index: 100;
        }
        .nav-tip::before {
          content: '';
          position: absolute;
          right: 100%;
          top: 50%;
          transform: translateY(-50%);
          border: 5px solid transparent;
          border-right-color: #18181b;
        }
        .nav-tip-wrap:hover .nav-tip {
          opacity: 1;
          transform: translateY(-50%) scale(1);
        }
      `}</style>
    </div>
  );
}

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
      {/* Logo */}
      <NavTooltip label="Home">
        <Link href="/jobs" style={{ width: 38, height: 38, borderRadius: 13, background: '#18181b', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 0, textDecoration: 'none' }}>
          <div style={{ width: 13, height: 13, background: '#10b981', transform: 'rotate(45deg)', borderRadius: 2 }} />
        </Link>
      </NavTooltip>

      {/* Admin */}
      {isAdmin && (
        <>
          <div style={{ width: 22, height: 1, background: '#e4e4e7', margin: '2px 0' }} />
          <NavTooltip label={ADMIN_ITEM.title}>
            <Link href={ADMIN_ITEM.href} className={navBtn(isActive(ADMIN_ITEM.href))}>
              {ADMIN_ITEM.icon}
            </Link>
          </NavTooltip>
        </>
      )}

      <div style={{ width: 22, height: 1, background: '#e4e4e7', margin: '2px 0' }} />

      {/* Main nav */}
      {MAIN_ITEMS.map((item) => (
        <NavTooltip key={item.href} label={item.title}>
          <Link href={item.href} className={navBtn(isActive(item.href))}>
            {item.icon}
          </Link>
        </NavTooltip>
      ))}

      <div style={{ width: 22, height: 1, background: '#e4e4e7', margin: '2px 0' }} />

      {/* Settings */}
      <NavTooltip label="Settings">
        <button className={navBtn(false)}>
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="10" r="3" stroke="currentColor" strokeWidth="1.6" />
            <circle cx="10" cy="10" r="7.2" stroke="currentColor" strokeWidth="1.6" strokeDasharray="2.5 3" />
          </svg>
        </button>
      </NavTooltip>
    </div>
  );
}
