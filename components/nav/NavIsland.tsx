'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

type Props = { isAdmin: boolean; initials: string };

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

function NavBtn({ href, label, active, children }: { href: string; label: string; active: boolean; children: React.ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Link
            href={href}
            className={cn(
              'flex h-[42px] w-[42px] items-center justify-center rounded-[14px] transition-all duration-200',
              active
                ? 'bg-foreground text-background shadow-sm'
                : 'bg-transparent text-muted-foreground hover:bg-accent hover:text-foreground'
            )}
          />
        }
      >
        {children}
      </TooltipTrigger>
      <TooltipContent side="right" className="font-mono text-xs">
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

export default function NavIsland({ isAdmin, initials }: Props) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/jobs') return pathname === '/jobs' || (pathname.startsWith('/jobs/') && !pathname.includes('admin'));
    return pathname.startsWith(href);
  };

  return (
    <TooltipProvider delay={200}>
      <nav
        className="fixed left-4 top-1/2 z-50 -translate-y-1/2 flex flex-col items-center gap-1 rounded-[20px] border px-2 py-[10px]"
        style={{
          background: 'var(--nav-bg)',
          borderColor: 'var(--nav-border)',
          boxShadow: 'var(--nav-shadow)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
        }}
      >
        {/* Logo */}
        <Tooltip>
          <TooltipTrigger
            render={
              <Link
                href="/jobs"
                className="flex h-[38px] w-[38px] items-center justify-center rounded-[13px] bg-foreground text-background flex-shrink-0"
              />
            }
          >
            <div className="h-[13px] w-[13px] rotate-45 rounded-sm bg-[var(--green)]" />
          </TooltipTrigger>
          <TooltipContent side="right" className="font-mono text-xs">CoreMatch</TooltipContent>
        </Tooltip>

        <div className="my-0.5 h-px w-[22px] bg-border" />

        {NAV_ITEMS.map((item) => (
          <NavBtn key={item.href} href={item.href} label={item.label} active={isActive(item.href)}>
            {item.icon}
          </NavBtn>
        ))}

        <div className="my-0.5 h-px w-[22px] bg-border" />

        {isAdmin && (
          <NavBtn href={ADMIN_ITEM.href} label={ADMIN_ITEM.label} active={isActive(ADMIN_ITEM.href)}>
            {ADMIN_ITEM.icon}
          </NavBtn>
        )}

        {/* Profile avatar */}
        <Tooltip>
          <TooltipTrigger
            render={
              <Link
                href="/profile"
                className={cn(
                  'flex h-[38px] w-[38px] items-center justify-center rounded-full text-[12px] font-bold transition-all duration-200',
                  isActive('/profile')
                    ? 'bg-foreground text-background'
                    : 'bg-muted text-foreground hover:bg-accent'
                )}
                style={{ fontFamily: 'var(--font-space)' }}
              />
            }
          >
            {initials}
          </TooltipTrigger>
          <TooltipContent side="right" className="font-mono text-xs">My Profile</TooltipContent>
        </Tooltip>
      </nav>
    </TooltipProvider>
  );
}
