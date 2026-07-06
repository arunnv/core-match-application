'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="User menu"
        className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-foreground text-background text-[11px] font-semibold cursor-pointer border-none outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 hover:opacity-90 transition-opacity"
        style={{ fontFamily: 'var(--font-space)' }}
      >
        {initials}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52 font-mono text-xs">
        <DropdownMenuLabel className="font-normal pb-2">
          <p className="font-semibold text-foreground text-[13px]">{userName}</p>
          <p className="text-muted-foreground text-[11px] truncate">{email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer gap-2 text-[13px]" onClick={() => window.location.href = '/profile'}>
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="7" r="3.5" stroke="currentColor" strokeWidth="1.6" />
            <path d="M3 17c0-3.3 3.1-6 7-6s7 2.7 7 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          Profile
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer gap-2 text-[13px]"
          variant="destructive"
          onClick={() => onSignOut()}
        >
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
            <path d="M7 3H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            <path d="M13 14l3-4-3-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M16 10H8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
