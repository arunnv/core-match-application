'use client';

import { usePathname } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import UserMenu from './UserMenu';

function PageTitle() {
  const pathname = usePathname();
  const segments: { label: string }[] = [{ label: 'CoreMatch' }];

  if (pathname === '/jobs') {
    segments.push({ label: 'Jobs' });
  } else if (pathname.startsWith('/jobs/')) {
    segments.push({ label: 'Jobs' });
    if (pathname.includes('/rubric')) segments.push({ label: 'Rubric' });
    else if (pathname.includes('/candidates')) segments.push({ label: 'Candidates' });
  } else if (pathname.startsWith('/candidates')) {
    segments.push({ label: 'All Candidates' });
  } else if (pathname.startsWith('/admin/users')) {
    segments.push({ label: 'Admin' });
    segments.push({ label: 'Users' });
  } else if (pathname.startsWith('/admin')) {
    segments.push({ label: 'Admin' });
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

type AiStatus = 'checking' | 'ok' | 'error';

function AiStatusBadge() {
  const [status, setStatus] = useState<AiStatus>('checking');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [popoverOpen, setPopoverOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const check = async () => {
    try {
      const res = await fetch('/api/ai-status');
      const data = await res.json();
      if (data.ok) {
        setStatus('ok');
        setErrorMsg('');
      } else {
        setStatus('error');
        setErrorMsg(data.error ?? 'Unknown error');
      }
    } catch {
      setStatus('error');
      setErrorMsg('Could not reach the server.');
    }
  };

  useEffect(() => {
    check();
    const interval = setInterval(check, 60_000); // re-check every 60s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setPopoverOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const dot = {
    checking: { bg: '#a1a1aa', shadow: '0 0 0 2.5px #f4f4f5' },
    ok:       { bg: '#10b981', shadow: '0 0 0 2.5px #d1fae5' },
    error:    { bg: '#ef4444', shadow: '0 0 0 2.5px #fee2e2' },
  }[status];

  const label = {
    checking: 'AI Engine',
    ok:       'AI Engine',
    error:    'AI Engine',
  }[status];

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => { if (status !== 'checking') setPopoverOpen(o => !o); }}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          fontSize: 11.5, color: status === 'error' ? '#ef4444' : '#71717a',
          fontFamily: 'var(--font-mono)',
          background: 'none', border: 'none',
          cursor: status === 'checking' ? 'default' : 'pointer',
          padding: '4px 8px',
          borderRadius: 8,
          transition: 'background .15s',
        }}
        onMouseEnter={e => { if (status !== 'checking') (e.currentTarget as HTMLElement).style.background = '#f4f4f5'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none'; }}
      >
        <span style={{
          width: 6, height: 6, borderRadius: '50%',
          background: dot.bg,
          boxShadow: dot.shadow,
          flexShrink: 0,
          ...(status === 'checking' ? { animation: 'pulse 1.4s ease-in-out infinite' } : {}),
        }} />
        {label}
      </button>

      {popoverOpen && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', right: 0,
          minWidth: 260, maxWidth: 340,
          background: '#fff',
          border: `1px solid ${status === 'error' ? '#fecaca' : '#e4e4e7'}`,
          borderRadius: 12,
          boxShadow: '0 8px 24px -4px rgba(24,24,27,.16)',
          padding: '14px 16px',
          zIndex: 200,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: status === 'error' ? 10 : 0 }}>
            <span style={{
              width: 8, height: 8, borderRadius: '50%',
              background: dot.bg, boxShadow: dot.shadow, flexShrink: 0,
            }} />
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '.12em',
              color: status === 'error' ? '#b91c1c' : '#059669',
              fontWeight: 600,
            }}>
              {status === 'ok' ? 'GEMINI API CONNECTED' : 'GEMINI API ERROR'}
            </span>
          </div>

          {status === 'error' && (
            <>
              <div style={{
                padding: '10px 12px',
                background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8,
                fontSize: 12, color: '#b91c1c', lineHeight: 1.55,
                fontFamily: 'var(--font-mono)',
              }}>
                {errorMsg}
              </div>
              <button
                onClick={() => { setStatus('checking'); check().then(() => {}); }}
                style={{
                  marginTop: 10, width: '100%',
                  padding: '8px', borderRadius: 8,
                  border: '1px solid #e4e4e7', background: '#f8f8f9',
                  fontSize: 12, color: '#52525b', cursor: 'pointer',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                Retry connection
              </button>
            </>
          )}

          {status === 'ok' && (
            <div style={{ fontSize: 11, color: '#a1a1aa', marginTop: 4, fontFamily: 'var(--font-mono)' }}>
              Gemini 2.5 Pro · Ready
            </div>
          )}
        </div>
      )}

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.3} }`}</style>
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <AiStatusBadge />
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
