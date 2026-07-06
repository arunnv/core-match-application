'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type Tenant = { id: string; company: string; roles: number; users: number; region: string; status: string };

const MODELS = ['Gemini 1.5 Pro', 'Gemini 1.5 Flash', 'Open-Source Llama 3 (Beta)'] as const;
const BAR_HEIGHTS = [20, 35, 45, 52, 48, 38, 42, 55, 50, 44, 38, 48, 52, 58, 62];

export default function AdminCockpit({ tenants }: { tenants: Tenant[] }) {
  const [model, setModel] = useState<string>('Gemini 1.5 Pro');
  const [maintenance, setMaintenance] = useState(false);

  return (
    <div style={{ maxWidth: 1400, padding: '80px 48px 90px 96px' }} className="animate-rise">
      {/* Header */}
      <div className="flex items-end justify-between gap-6 mb-8">
        <div>
          <div className="text-[11px] tracking-[.22em] text-muted-foreground mb-3.5">SYSTEM / SUPER_ADMIN_COCKPIT</div>
          <h1 className="font-light text-[44px] leading-none tracking-[-0.02em] m-0 text-foreground" style={{ fontFamily: 'var(--font-space)' }}>
            System <span className="font-semibold">Control Panel</span>
          </h1>
        </div>
        <div className="flex gap-2 pb-1.5">
          <Button className="font-mono text-[12px]">Cockpit</Button>
          <Link href="/admin/users" className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-border bg-card px-4 py-2 font-mono text-[12px] text-foreground hover:bg-accent transition-colors">
            Users &amp; Usage
          </Link>
        </div>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: 'TOTAL TENANTS', value: '142', sub: '+12 this week', dot: false, subColor: '' },
          { label: 'AI EVALUATIONS', value: '842,109', sub: 'Avg Parse: 3.1s', dot: false, subColor: '' },
          { label: 'LLM API CALLS', value: '1.2M', sub: 'System healthy', subColor: 'text-[var(--green)]', dot: true },
          { label: 'QUEUE STATUS', value: '0 DELAY', sub: 'Operating nominally', dot: false, subColor: '' },
        ].map(({ label, value, sub, subColor, dot }) => (
          <div key={label} className="bg-card border border-border rounded-[14px] p-5 shadow-sm">
            <div className="flex items-center gap-1.5 mb-2.5">
              {dot && <span className="w-1.5 h-1.5 rounded-full bg-[var(--green)]" />}
              <span className="text-[9.5px] tracking-[.16em] text-muted-foreground">{label}</span>
            </div>
            <div className="font-light text-[28px] text-foreground mb-2" style={{ fontFamily: 'var(--font-space)' }}>{value}</div>
            <div className={cn('text-[10px]', subColor || 'text-muted-foreground')}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Transaction chart */}
      <div className="bg-card border border-border rounded-[14px] p-6 mb-8 shadow-sm">
        <div className="font-semibold text-[16px] text-foreground mb-5" style={{ fontFamily: 'var(--font-space)' }}>Global Transaction Volume</div>
        <div className="h-[180px] flex items-end justify-around gap-1 px-5 py-5 rounded-[10px] relative"
          style={{ background: 'linear-gradient(to bottom, transparent 0%, hsl(var(--muted)) 100%)' }}>
          {BAR_HEIGHTS.map((h, i) => (
            <div key={i} className={cn('flex-1 rounded-[2px]', h > 44 ? 'bg-[var(--green)]' : 'bg-muted-foreground/30')} style={{ height: `${h}%` }} />
          ))}
          <div className="text-[8px] absolute bottom-0 right-0 text-muted-foreground">30-day span</div>
        </div>
      </div>

      {/* Tenants + controls */}
      <div className="grid gap-6 items-start" style={{ gridTemplateColumns: '2fr 1fr' }}>
        {/* Tenant table */}
        <div className="bg-card border border-border rounded-[14px] p-6 shadow-sm">
          <div className="font-semibold text-[16px] text-foreground mb-5" style={{ fontFamily: 'var(--font-space)' }}>Active Enterprise Tenants</div>
          <div className="grid gap-4 py-3 pb-2 border-b-2 border-border text-[10px] tracking-[.12em] text-muted-foreground font-medium"
            style={{ gridTemplateColumns: '1.5fr 90px 80px 1.8fr 80px' }}>
            <div>Company Name</div><div>Active Roles</div><div>Total Users</div><div>Data Center Region</div><div>Status</div>
          </div>
          {tenants.map((t) => (
            <div key={t.id} className="grid gap-4 items-center py-3.5 border-b border-border/50 text-[12.5px]"
              style={{ gridTemplateColumns: '1.5fr 90px 80px 1.8fr 80px' }}>
              <div className="font-medium text-foreground">{t.company}</div>
              <div className="text-muted-foreground text-center">{t.roles}</div>
              <div className="text-muted-foreground text-center">{t.users}</div>
              <div className="text-muted-foreground text-[11px]">{t.region}</div>
              <div className="text-center">
                <Badge variant="outline" className="text-[9px] tracking-[.12em] text-[var(--green)] bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800">
                  {t.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>

        {/* System config */}
        <div className="bg-card border border-border rounded-[14px] p-6 shadow-sm">
          <div className="font-semibold text-[16px] text-foreground mb-5" style={{ fontFamily: 'var(--font-space)' }}>System Configuration</div>

          <div className="mb-7">
            <div className="text-[10px] tracking-[.14em] text-muted-foreground mb-3">LLM MODEL ENGINE</div>
            <div className="flex flex-col gap-2">
              {MODELS.map((m) => {
                const isDisabled = m === 'Open-Source Llama 3 (Beta)';
                const isActive = model === m;
                return (
                  <button
                    key={m}
                    onClick={() => !isDisabled && setModel(m)}
                    disabled={isDisabled}
                    className={cn(
                      'text-left px-3.5 py-3 rounded-[9px] border font-mono text-[12px] cursor-pointer transition-all',
                      isActive ? 'border-green-300 dark:border-green-800 bg-green-50 dark:bg-green-950/30 text-[var(--green)]' : 'border-border bg-card text-foreground hover:border-muted-foreground/40',
                      isDisabled && 'opacity-50 cursor-not-allowed'
                    )}
                  >{m}</button>
                );
              })}
            </div>
          </div>

          <div className="border-t border-border pt-5">
            <div className="text-[10px] tracking-[.14em] text-muted-foreground mb-3">SYSTEM CONTROLS</div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[13px] font-medium text-foreground">Maintenance Mode</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">Disable new AI evaluations</div>
              </div>
              <button
                onClick={() => setMaintenance(!maintenance)}
                className={cn('relative w-10 h-6 rounded-full border-none cursor-pointer transition-colors', maintenance ? 'bg-amber-500' : 'bg-muted-foreground/30')}
              >
                <span className={cn('absolute top-[3px] w-[18px] h-[18px] rounded-full bg-white shadow-sm transition-[left_.2s]', maintenance ? 'left-[18px]' : 'left-[3px]')} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
