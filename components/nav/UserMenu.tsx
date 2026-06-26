'use client';

import { useState, useRef, useEffect } from 'react';

export default function UserMenu({
  userName,
  initials,
  email,
  onSignOut,
}: {
  userName: string;
  initials: string;
  email: string;
  onSignOut: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen((o) => !o)}
        title={userName}
        style={{
          width: 30,
          height: 30,
          borderRadius: '50%',
          background: '#18181b',
          color: '#fff',
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 11,
          fontWeight: 600,
          cursor: 'pointer',
          outline: open ? '2px solid #10b981' : 'none',
          outlineOffset: 2,
        }}
      >
        {initials}
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: 38,
            right: 0,
            minWidth: 200,
            background: '#fff',
            border: '1px solid #e4e4e7',
            borderRadius: 12,
            boxShadow: '0 8px 24px -4px rgba(24,24,27,.18), 0 2px 8px -2px rgba(24,24,27,.08)',
            overflow: 'hidden',
            zIndex: 100,
          }}
        >
          {/* User info header */}
          <div style={{ padding: '12px 14px 10px', borderBottom: '1px solid #f4f4f5' }}>
            <div style={{ fontWeight: 600, fontSize: 13, color: '#18181b', marginBottom: 2 }}>{userName}</div>
            <div style={{ fontSize: 11, color: '#a1a1aa', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{email}</div>
          </div>

          {/* Menu items */}
          <div style={{ padding: '6px 0' }}>
            <a
              href="/profile"
              onClick={() => setOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 14px',
                fontSize: 13,
                color: '#18181b',
                textDecoration: 'none',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#f4f4f5')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="7" r="3.5" stroke="currentColor" strokeWidth="1.6" />
                <path d="M3 17c0-3.3 3.1-6 7-6s7 2.7 7 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
              Profile
            </a>

            <div style={{ height: 1, background: '#f4f4f5', margin: '4px 0' }} />

            <button
              onClick={() => { setOpen(false); onSignOut(); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 14px',
                fontSize: 13,
                color: '#ef4444',
                background: 'transparent',
                border: 'none',
                width: '100%',
                textAlign: 'left',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#fef2f2')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
                <path d="M7 3H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                <path d="M13 14l3-4-3-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M16 10H8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
