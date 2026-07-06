'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type User = { id: string; name: string; role: string; lastLogin: string; credits: number; enabled: boolean };

type AuthLog = {
  id: string;
  ipAddress: string | null;
  userAgent: string | null;
  authMethod: string;
  status: string;
  createdAt: string;
};

export default function AdminUsers({
  initialUsers,
  totalSignUps,
  totalCreditsUsed,
}: {
  initialUsers: User[];
  totalSignUps: number;
  totalCreditsUsed: number;
}) {
  const [users, setUsers] = useState(initialUsers);
  const [drawerId, setDrawerId] = useState<string | null>(null);
  const [authLogs, setAuthLogs] = useState<AuthLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  useEffect(() => {
    if (!drawerId) { setAuthLogs([]); return; }
    setLogsLoading(true);
    fetch(`/api/admin/users/${drawerId}`)
      .then((r) => r.json())
      .then((data: { logs: AuthLog[] }) => setAuthLogs(data.logs ?? []))
      .catch(() => setAuthLogs([]))
      .finally(() => setLogsLoading(false));
  }, [drawerId]);

  const toggleUser = async (id: string) => {
    const user = users.find((u) => u.id === id);
    if (!user) return;
    const newEnabled = !user.enabled;
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, enabled: newEnabled } : u)));
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: newEnabled }),
      });
      if (!res.ok) setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, enabled: user.enabled } : u)));
    } catch {
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, enabled: user.enabled } : u)));
    }
  };

  const drawerUser = users.find((u) => u.id === drawerId) ?? null;
  const topConsumers = [...users].sort((a, b) => b.credits - a.credits).slice(0, 3);
  const maxCredits = Math.max(...users.map((u) => u.credits), 1);
  const formatNumber = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n);

  const fmtTs = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) + ' ' +
      d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  };

  const fmtUA = (ua: string | null) => {
    if (!ua) return '—';
    if (/chrome/i.test(ua)) return 'Chrome';
    if (/safari/i.test(ua)) return 'Safari';
    if (/firefox/i.test(ua)) return 'Firefox';
    if (/edge/i.test(ua)) return 'Edge';
    return 'Browser';
  };

  return (
    <>
      <div style={{ maxWidth: 1400, padding: '80px 48px 90px 96px' }} className="animate-rise">
        {/* Header */}
        <div className="flex items-end justify-between gap-6 mb-6">
          <div>
            <div className="text-[11px] tracking-[.22em] text-muted-foreground mb-3">SYSTEM / USERS_AND_USAGE</div>
            <h1 className="font-light leading-none tracking-[-0.02em] m-0 text-foreground" style={{ fontFamily: 'var(--font-space)', fontSize: 'clamp(28px, 5vw, 44px)' }}>
              User Management <span className="font-semibold">&amp; Credits</span>
            </h1>
          </div>
          <div className="flex gap-2 pb-1.5">
            <Link href="/admin" className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-border bg-card px-4 py-2 font-mono text-[12px] text-foreground hover:bg-accent transition-colors">
              Cockpit
            </Link>
            <Button className="font-mono text-[12px]">Users &amp; Usage</Button>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-3 gap-3.5 mb-5">
          {[
            { label: 'TOTAL SIGN-UPS', value: totalSignUps.toLocaleString(), sub: `${users.filter(u => u.enabled).length} active`, dot: false, subColor: '' },
            { label: 'ACTIVE ACCOUNTS', value: users.filter(u => u.enabled).length.toString(), sub: 'Enabled users', subColor: 'text-[var(--green)]', dot: true },
            { label: 'TOTAL CREDITS USED', value: formatNumber(totalCreditsUsed), sub: 'Lifetime across all users', subColor: 'text-amber-600', dot: false },
          ].map(({ label, value, sub, subColor, dot }) => (
            <div key={label} className="bg-card border border-border rounded-[14px] p-[18px] shadow-sm">
              <div className="flex items-center gap-1.5 mb-2.5">
                {dot && <span className="w-1.5 h-1.5 rounded-full bg-[var(--green)] shrink-0" />}
                <span className="text-[9.5px] tracking-[.16em] text-muted-foreground">{label}</span>
              </div>
              <div className="font-light text-foreground mb-1.5" style={{ fontFamily: 'var(--font-space)', fontSize: 'clamp(22px, 4vw, 28px)' }}>{value}</div>
              <div className={cn('text-[10px]', subColor || 'text-muted-foreground')}>{sub}</div>
            </div>
          ))}
        </div>

        {/* Body */}
        <div className="grid gap-4" style={{ gridTemplateColumns: '260px 1fr' }}>
          {/* Top consumers */}
          <div className="bg-card border border-border rounded-[14px] p-[18px] shadow-sm h-fit">
            <div className="font-semibold text-[14px] text-foreground mb-4" style={{ fontFamily: 'var(--font-space)' }}>Top AI Credit Consumers</div>
            <div className="flex flex-col gap-3.5">
              {topConsumers.map((c) => {
                const pct = (c.credits / maxCredits) * 100;
                return (
                  <div key={c.id}>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-[12px] font-medium text-foreground">{c.name}</span>
                      <span className="text-[10px] text-muted-foreground">{c.credits.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full bg-border overflow-hidden">
                        <div className={cn('h-full rounded-full transition-all', pct > 70 ? 'bg-amber-500' : 'bg-green-300 dark:bg-green-700')} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-[9px] text-muted-foreground w-6">{Math.round(pct)}%</span>
                    </div>
                  </div>
                );
              })}
              {topConsumers.length === 0 && <div className="text-[12px] text-muted-foreground text-center py-4">No data yet</div>}
            </div>
          </div>

          {/* User directory */}
          <div className="bg-card border border-border rounded-[14px] p-[18px] shadow-sm overflow-x-auto">
            <div className="font-semibold text-[15px] text-foreground mb-4" style={{ fontFamily: 'var(--font-space)' }}>Global User Directory</div>
            <div className="min-w-[560px]">
              <div className="grid gap-3.5 py-2.5 border-b-2 border-border text-[9.5px] tracking-[.12em] text-muted-foreground font-medium"
                style={{ gridTemplateColumns: '1.4fr 1.2fr 110px 130px 90px 70px' }}>
                <div>User Name</div><div>Role</div><div>Last Login</div><div>Credits</div><div>Status</div><div>Toggle</div>
              </div>
              {users.map((u) => (
                <div key={u.id} className="grid gap-3.5 items-center py-2.5 border-b border-border/50 cursor-pointer hover:bg-muted/40 transition-colors rounded-sm"
                  style={{ gridTemplateColumns: '1.4fr 1.2fr 110px 130px 90px 70px' }}
                  onClick={() => setDrawerId(u.id)}>
                  <div className="font-medium text-[12.5px] text-foreground truncate">{u.name}</div>
                  <div className="text-[11px] text-muted-foreground truncate">{u.role}</div>
                  <div className="text-[11px] text-muted-foreground">{u.lastLogin}</div>
                  <div className="font-medium text-[12px] text-foreground" style={{ fontVariantNumeric: 'tabular-nums' }}>{u.credits.toLocaleString()}</div>
                  <div>
                    <Badge variant="outline" className={cn('text-[9px] tracking-[.1em]', u.enabled ? 'text-[var(--green)] bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800' : 'text-muted-foreground bg-muted border-border')}>
                      {u.enabled ? 'On' : 'Off'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-center">
                    <button
                      onClick={(e) => { e.stopPropagation(); void toggleUser(u.id); }}
                      className={cn('w-10 h-6 rounded-full border-none cursor-pointer relative transition-all', u.enabled ? 'bg-[var(--green)]' : 'bg-muted-foreground/30')}
                      aria-label={u.enabled ? 'Disable user' : 'Enable user'}
                    >
                      <div className={cn('absolute w-5 h-5 rounded-full bg-white top-0.5 transition-[left_.3s]', u.enabled ? 'left-[18px]' : 'left-0.5')} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* User detail drawer */}
      {drawerUser && (
        <>
          <div onClick={() => setDrawerId(null)} className="fixed inset-0 z-[60] bg-black/15 backdrop-blur-[1.5px]" />
          <div className="cm-scroll fixed top-0 right-0 bottom-0 z-[61] w-[min(440px,100vw)] bg-card border-l border-border overflow-y-auto"
            style={{ boxShadow: '-30px 0 60px -30px rgba(24,24,27,.3)' }}>
            <div className="sticky top-0 border-b border-border px-5 py-4 flex items-center justify-between z-[1] backdrop-blur-md"
              style={{ background: 'var(--topbar-bg)' }}>
              <div className="text-[11px] tracking-[.2em] text-muted-foreground">USER ACCOUNT</div>
              <Button variant="outline" size="icon" onClick={() => setDrawerId(null)} className="h-8 w-8 rounded-[10px] font-mono text-[15px]">✕</Button>
            </div>

            <div className="p-5 pb-10">
              <div className="font-semibold text-[20px] text-foreground mb-1" style={{ fontFamily: 'var(--font-space)' }}>{drawerUser.name}</div>
              <div className="text-[12px] text-muted-foreground mb-5">{drawerUser.role}</div>

              <div className="flex flex-col gap-3.5 py-4 border-t border-b border-border">
                {[
                  { label: 'LAST LOGIN', value: drawerUser.lastLogin, mono: false },
                  { label: 'LIFETIME CREDITS', value: drawerUser.credits.toLocaleString(), bold: true },
                  { label: 'ACCOUNT STATUS', value: drawerUser.enabled ? 'Active' : 'Suspended', mono: false },
                ].map(({ label, value, bold }) => (
                  <div key={label}>
                    <span className="text-[10px] text-muted-foreground tracking-[.12em]">{label}</span>
                    <div className={cn('text-[13px] text-foreground mt-1', bold && 'font-semibold text-[20px]')} style={bold ? { fontFamily: 'var(--font-space)' } : undefined}>
                      {value}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 pb-5 border-b border-border">
                <div className="text-[10px] text-muted-foreground tracking-[.12em] mb-2.5">LOGIN HISTORY</div>
                {logsLoading ? (
                  <div className="text-[11px] text-muted-foreground py-3">Loading…</div>
                ) : authLogs.length === 0 ? (
                  <div className="text-[11px] text-muted-foreground py-3">No login events recorded yet.</div>
                ) : (
                  <div className="max-h-[192px] overflow-y-auto">
                    <div className="grid gap-2 items-center pb-1.5 mb-0.5 border-b border-border" style={{ gridTemplateColumns: '90px 1fr 70px 52px' }}>
                      {['TIMESTAMP', 'IP ADDRESS', 'METHOD', 'STATUS'].map((h) => (
                        <div key={h} className="text-[8.5px] tracking-[.1em] text-muted-foreground font-medium">{h}</div>
                      ))}
                    </div>
                    {authLogs.map((log) => (
                      <div key={log.id} className="grid gap-2 items-center py-1.5 border-b border-border/40 last:border-0" style={{ gridTemplateColumns: '90px 1fr 70px 52px' }}>
                        <div className="font-mono text-[10px] text-muted-foreground whitespace-nowrap">{fmtTs(log.createdAt)}</div>
                        <div className="font-mono text-[10px] text-muted-foreground overflow-hidden text-ellipsis whitespace-nowrap">{log.ipAddress ?? '—'}</div>
                        <div className="text-[10px] text-muted-foreground">
                          {log.authMethod === 'Google SSO'
                            ? <span className="text-blue-600 dark:text-blue-400">Google</span>
                            : <span>{fmtUA(log.userAgent)}</span>}
                        </div>
                        <div>
                          <Badge variant="outline" className={cn('text-[8.5px] tracking-[.08em] font-medium', log.status === 'Success' ? 'text-[var(--green)] bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800' : 'text-destructive bg-destructive/10 border-destructive/30')}>
                            {log.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2.5 mt-5">
                <Button
                  onClick={() => void toggleUser(drawerUser.id)}
                  variant="outline"
                  className={cn('w-full font-mono text-[13px] font-medium', drawerUser.enabled ? 'text-red-700 dark:text-red-400 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-950/50' : 'text-[var(--green)] border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/30 hover:bg-green-100 dark:hover:bg-green-950/50')}
                >
                  {drawerUser.enabled ? 'Suspend User Account' : 'Reactivate Account'}
                </Button>
                <Button variant="outline" className="w-full font-mono text-[13px]">Reset API Keys</Button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
