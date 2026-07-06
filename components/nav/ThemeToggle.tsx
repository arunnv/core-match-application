'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const SunIcon = () => (
  <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
    <circle cx="10" cy="10" r="4" stroke="currentColor" strokeWidth="1.7" />
    <path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.22 4.22l1.42 1.42M14.36 14.36l1.42 1.42M4.22 15.78l1.42-1.42M14.36 5.64l1.42-1.42" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
  </svg>
);

const MoonIcon = () => (
  <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
    <path d="M17.5 11.5A7.5 7.5 0 0 1 8.5 2.5a7.5 7.5 0 1 0 9 9z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const MonitorIcon = () => (
  <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
    <rect x="2" y="3" width="16" height="11" rx="2" stroke="currentColor" strokeWidth="1.7" />
    <path d="M7 17h6M10 14v3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
  </svg>
);

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="h-8 w-8" />;

  const icon = theme === 'dark' ? <MoonIcon /> : theme === 'light' ? <SunIcon /> : <MonitorIcon />;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Toggle theme"
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent border-none bg-transparent cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
      >
        {icon}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36 font-mono text-xs">
        <DropdownMenuItem onClick={() => setTheme('light')} className="gap-2 cursor-pointer">
          <SunIcon /> Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('dark')} className="gap-2 cursor-pointer">
          <MoonIcon /> Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('system')} className="gap-2 cursor-pointer">
          <MonitorIcon /> System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
