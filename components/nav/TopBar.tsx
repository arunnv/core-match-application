'use client';

import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import UserMenu from './UserMenu';
import { ThemeToggle } from './ThemeToggle';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

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
    <div className="flex items-center gap-1.5">
      {segments.map((seg, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <span className="text-muted-foreground/40 text-sm">/</span>}
          <span
            className={cn(
              'text-[14px] tracking-[-0.01em]',
              i === segments.length - 1
                ? 'font-semibold text-foreground'
                : 'font-normal text-muted-foreground'
            )}
            style={{ fontFamily: 'var(--font-space)' }}
          >
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
  const [errorMsg, setErrorMsg] = useState('');

  const check = async () => {
    try {
      const res = await fetch('/api/ai-status');
      const data = await res.json();
      if (data.ok) { setStatus('ok'); setErrorMsg(''); }
      else { setStatus('error'); setErrorMsg(data.error ?? 'Unknown error'); }
    } catch {
      setStatus('error');
      setErrorMsg('Could not reach the server.');
    }
  };

  useEffect(() => {
    check();
    const id = setInterval(check, 60_000);
    return () => clearInterval(id);
  }, []);

  const dotClass = {
    checking: 'bg-muted-foreground pulse-dot',
    ok: 'bg-[var(--green)]',
    error: 'bg-destructive',
  }[status];

  const dotRing = {
    checking: '',
    ok: 'shadow-[0_0_0_2.5px_var(--green-bg)]',
    error: 'shadow-[0_0_0_2.5px_hsl(var(--destructive)/0.15)]',
  }[status];

  return (
    <Popover>
      <PopoverTrigger
        disabled={status === 'checking'}
        className={cn(
          'inline-flex h-8 items-center gap-1.5 rounded-lg px-2 font-mono text-[11.5px] border-none bg-transparent cursor-pointer transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring',
          status === 'error'
            ? 'text-destructive hover:bg-destructive/10'
            : 'text-muted-foreground hover:text-foreground hover:bg-accent',
          status === 'checking' && 'pointer-events-none'
        )}
      >
        <span className={cn('h-1.5 w-1.5 rounded-full flex-shrink-0', dotClass, dotRing)} />
        AI Engine
      </PopoverTrigger>
      <PopoverContent align="end" side="bottom" className="w-72 p-4 font-mono">
        <div className="flex items-center gap-2 mb-1">
          <span className={cn('h-2 w-2 rounded-full flex-shrink-0', dotClass, dotRing)} />
          <span className={cn(
            'text-[11px] font-semibold tracking-widest uppercase',
            status === 'ok' ? 'text-[var(--green-dark)]' : 'text-destructive'
          )}>
            {status === 'ok' ? 'Gemini API Connected' : 'Gemini API Error'}
          </span>
        </div>
        {status === 'ok' && (
          <p className="text-[11px] text-muted-foreground mt-1">Gemini 2.5 Pro · Ready</p>
        )}
        {status === 'error' && (
          <>
            <div className="mt-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-[12px] text-destructive leading-relaxed">
              {errorMsg}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="mt-3 w-full text-[12px] font-mono"
              onClick={() => { setStatus('checking'); check(); }}
            >
              Retry connection
            </Button>
          </>
        )}
      </PopoverContent>
    </Popover>
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
    <header
      className="fixed top-0 left-0 right-0 z-40 flex h-[52px] items-center justify-between border-b"
      style={{
        padding: '0 24px 0 88px',
        background: 'var(--topbar-bg)',
        borderColor: 'var(--topbar-border)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      <PageTitle />
      <div className="flex items-center gap-1">
        <AiStatusBadge />
        <Separator orientation="vertical" className="h-5 mx-1" />
        <ThemeToggle />
        <UserMenu
          userName={userName}
          initials={initials}
          email={email}
          onSignOut={onSignOut}
        />
      </div>
    </header>
  );
}
