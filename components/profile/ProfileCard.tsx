'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type UserProfile = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: string;
  enabled: boolean;
  lifetimeCredits: number;
  lastLoginAt: string | null;
  createdAt: string;
  tenantName: string | null;
};

const ROLE_BADGE: Record<string, string> = {
  SuperAdmin:      'text-violet-700 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/30 border-violet-200 dark:border-violet-800',
  TenantAdmin:     'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800',
  RecruitmentLead: 'text-[var(--green)] bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800',
  HiringManager:   'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800',
  Recruiter:       'text-muted-foreground bg-muted border-border',
};

function fmt(iso: string) {
  const d = new Date(iso);
  return `${d.getUTCDate()} ${d.toLocaleString('en-GB', { month: 'short', timeZone: 'UTC' })} ${d.getUTCFullYear()}`;
}
function fmtTime(iso: string) {
  const d = new Date(iso);
  const date = `${d.getUTCDate()} ${d.toLocaleString('en-GB', { month: 'short', timeZone: 'UTC' })} ${d.getUTCFullYear()}`;
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const mm = String(d.getUTCMinutes()).padStart(2, '0');
  return `${date}, ${hh}:${mm}`;
}

export default function ProfileCard({ user }: { user: UserProfile }) {
  const initials = user.name
    ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : user.email.slice(0, 2).toUpperCase();

  const roleBadgeClass = ROLE_BADGE[user.role] ?? ROLE_BADGE.Recruiter;
  const [copied, setCopied] = useState(false);

  const copyId = () => {
    navigator.clipboard.writeText(user.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div style={{ maxWidth: 720, padding: '80px 48px 90px 96px' }} className="animate-rise">
      {/* Header */}
      <div className="text-[11px] tracking-[.22em] text-muted-foreground mb-3.5">COREMATCH / PROFILE</div>
      <h1 className="font-light text-[44px] leading-none tracking-[-0.02em] m-0 mb-9 text-foreground" style={{ fontFamily: 'var(--font-space)' }}>
        My <span className="font-semibold">Profile</span>
      </h1>

      {/* Identity card */}
      <div className="bg-card border border-border rounded-[20px] p-7 mb-4">
        <div className="flex items-center gap-5 mb-6">
          {user.image ? (
            <img src={user.image} alt={user.name} className="w-16 h-16 rounded-full object-cover border-2 border-border" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-foreground text-background flex items-center justify-center font-bold text-[22px] shrink-0" style={{ fontFamily: 'var(--font-space)' }}>
              {initials}
            </div>
          )}
          <div>
            <div className="font-bold text-[22px] text-foreground mb-1" style={{ fontFamily: 'var(--font-space)' }}>{user.name || '—'}</div>
            <div className="text-[13px] text-muted-foreground mb-2">{user.email}</div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={cn('text-[9.5px] tracking-[.14em]', roleBadgeClass)}>
                {user.role.replace(/([A-Z])/g, ' $1').trim().toUpperCase()}
              </Badge>
              {!user.enabled && (
                <Badge variant="outline" className="text-[9.5px] tracking-[.14em] text-destructive bg-destructive/10 border-destructive/30">
                  DISABLED
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-2 gap-3.5">
          <InfoRow label="Organisation" value={user.tenantName ?? '—'} />
          <InfoRow label="Member since" value={fmt(user.createdAt)} />
          <InfoRow label="Last login" value={user.lastLoginAt ? fmtTime(user.lastLoginAt) : 'Never'} />
          <InfoRow label="Evaluations credited" value={user.lifetimeCredits.toString()} mono />
        </div>
      </div>

      {/* Account ID */}
      <div className="bg-muted/40 border border-border rounded-[14px] px-4 py-3.5 flex items-center justify-between">
        <div>
          <div className="text-[9.5px] tracking-[.16em] text-muted-foreground mb-1">ACCOUNT ID</div>
          <div className="font-mono text-[12px] text-muted-foreground">{user.id}</div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={copyId}
          className={cn('font-mono text-[11px] whitespace-nowrap transition-all', copied && 'text-[var(--green)] border-green-300 dark:border-green-800 bg-green-50 dark:bg-green-950/30')}
        >
          {copied ? '✓ Copied' : 'Copy'}
        </Button>
      </div>
    </div>
  );
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="bg-muted/40 border border-border/50 rounded-[10px] px-3.5 py-3">
      <div className="text-[9.5px] tracking-[.14em] text-muted-foreground mb-1">{label.toUpperCase()}</div>
      <div className={cn('text-[13px] text-foreground', mono && 'font-mono')}>{value}</div>
    </div>
  );
}
