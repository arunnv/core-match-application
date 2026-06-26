'use client';

import { useState } from 'react';
import Link from 'next/link';

type Tenant = { id: string; company: string; roles: number; users: number; region: string; status: string };

const MODELS = ['Gemini 1.5 Pro', 'Gemini 1.5 Flash', 'Open-Source Llama 3 (Beta)'] as const;
const BAR_HEIGHTS = [20, 35, 45, 52, 48, 38, 42, 55, 50, 44, 38, 48, 52, 58, 62];

export default function AdminCockpit({ tenants }: { tenants: Tenant[] }) {
  const [model, setModel] = useState<string>('Gemini 1.5 Pro');
  const [maintenance, setMaintenance] = useState(false);

  return (
    <div style={{ maxWidth: 1400, padding: '80px 48px 90px 96px' }} className="animate-rise">
      {/* Header + nav */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24, marginBottom: 32 }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: '.22em', color: '#a1a1aa', marginBottom: 14 }}>SYSTEM / SUPER_ADMIN_COCKPIT</div>
          <h1 style={{ fontFamily: 'var(--font-space)', fontWeight: 300, fontSize: 44, lineHeight: 1, letterSpacing: '-.02em', margin: 0 }}>
            System <span style={{ fontWeight: 600 }}>Control Panel</span>
          </h1>
        </div>
        <div style={{ display: 'flex', gap: 8, paddingBottom: 6 }}>
          <button style={{ padding: '8px 16px', borderRadius: 9, border: 'none', background: '#18181b', color: '#fff', fontFamily: 'var(--font-mono)', fontSize: 12, cursor: 'pointer' }}>Cockpit</button>
          <Link href="/admin/users" style={{ padding: '8px 16px', borderRadius: 9, border: '1px solid #e4e4e7', background: '#fff', color: '#71717a', fontFamily: 'var(--font-mono)', fontSize: 12, cursor: 'pointer', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>Users &amp; Usage</Link>
        </div>
      </div>

      {/* Metrics grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 32 }}>
        {[
          { label: 'TOTAL TENANTS', value: '142', sub: '+12 this week', dot: false },
          { label: 'AI EVALUATIONS', value: '842,109', sub: 'Avg Parse: 3.1s', dot: false },
          { label: 'LLM API CALLS', value: '1.2M', sub: 'System healthy', subColor: '#059669', dot: true },
          { label: 'QUEUE STATUS', value: '0 DELAY', sub: 'Operating nominally', dot: false },
        ].map(({ label, value, sub, subColor, dot }) => (
          <div key={label} style={{ background: '#fff', border: '1px solid #e4e4e7', borderRadius: 14, padding: 20, boxShadow: '0 1px 2px rgba(24,24,27,.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
              {dot && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />}
              <span style={{ fontSize: 9.5, letterSpacing: '.16em', color: '#a1a1aa' }}>{label}</span>
            </div>
            <div style={{ fontFamily: 'var(--font-space)', fontWeight: 300, fontSize: 28, color: '#18181b', marginBottom: 8 }}>{value}</div>
            <div style={{ fontSize: 10, color: subColor ?? '#a1a1aa' }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Transaction chart */}
      <div style={{ background: '#fff', border: '1px solid #e4e4e7', borderRadius: 14, padding: 24, marginBottom: 32, boxShadow: '0 1px 2px rgba(24,24,27,.04)' }}>
        <div style={{ fontFamily: 'var(--font-space)', fontWeight: 600, fontSize: 16, color: '#18181b', marginBottom: 20 }}>Global Transaction Volume</div>
        <div style={{ height: 180, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', gap: 4, padding: 20, background: 'linear-gradient(to bottom,transparent 0%,#fafafa 100%)', borderRadius: 10, position: 'relative' }}>
          {BAR_HEIGHTS.map((h, i) => (
            <div key={i} style={{ flex: 1, height: `${h}%`, background: h > 44 ? '#10b981' : '#d4d4d8', borderRadius: 2 }} />
          ))}
          <div style={{ fontSize: 8, position: 'absolute', bottom: 0, right: 0, color: '#a1a1aa' }}>30-day span</div>
        </div>
      </div>

      {/* Tenants + controls */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24, alignItems: 'start' }}>
        {/* Tenant table */}
        <div style={{ background: '#fff', border: '1px solid #e4e4e7', borderRadius: 14, padding: 24, boxShadow: '0 1px 2px rgba(24,24,27,.04)' }}>
          <div style={{ fontFamily: 'var(--font-space)', fontWeight: 600, fontSize: 16, color: '#18181b', marginBottom: 20 }}>Active Enterprise Tenants</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 90px 80px 1.8fr 80px', gap: 18, padding: '12px 0', borderBottom: '2px solid #e4e4e7', fontSize: 10, letterSpacing: '.12em', color: '#a1a1aa', fontWeight: 500 }}>
            <div>Company Name</div><div>Active Roles</div><div>Total Users</div><div>Data Center Region</div><div>Status</div>
          </div>
          {tenants.map((t) => (
            <div key={t.id} style={{ display: 'grid', gridTemplateColumns: '1.5fr 90px 80px 1.8fr 80px', gap: 18, alignItems: 'center', padding: '14px 0', borderBottom: '1px solid #f1f1f2', fontSize: 12.5 }}>
              <div style={{ color: '#18181b', fontWeight: 500 }}>{t.company}</div>
              <div style={{ color: '#52525b', textAlign: 'center' }}>{t.roles}</div>
              <div style={{ color: '#52525b', textAlign: 'center' }}>{t.users}</div>
              <div style={{ color: '#52525b', fontSize: 11 }}>{t.region}</div>
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: 9, letterSpacing: '.12em', color: '#059669', background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '3px 9px', borderRadius: 5 }}>{t.status}</span>
              </div>
            </div>
          ))}
        </div>

        {/* System config */}
        <div style={{ background: '#fff', border: '1px solid #e4e4e7', borderRadius: 14, padding: 24, boxShadow: '0 1px 2px rgba(24,24,27,.04)' }}>
          <div style={{ fontFamily: 'var(--font-space)', fontWeight: 600, fontSize: 16, color: '#18181b', marginBottom: 22 }}>System Configuration</div>

          {/* Model selector */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 10, letterSpacing: '.14em', color: '#a1a1aa', marginBottom: 12 }}>LLM MODEL ENGINE</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {MODELS.map((m) => {
                const isDisabled = m === 'Open-Source Llama 3 (Beta)';
                const isActive = model === m;
                return (
                  <button
                    key={m}
                    onClick={() => !isDisabled && setModel(m)}
                    disabled={isDisabled}
                    style={{ textAlign: 'left', padding: '12px 14px', borderRadius: 9, border: `1px solid ${isActive ? '#a7f3d0' : '#e4e4e7'}`, background: isActive ? '#ecfdf5' : '#fff', color: isActive ? '#059669' : '#18181b', fontFamily: 'var(--font-mono)', fontSize: 12, cursor: isDisabled ? 'not-allowed' : 'pointer', opacity: isDisabled ? 0.5 : 1, transition: 'all .2s' }}
                  >{m}</button>
                );
              })}
            </div>
          </div>

          {/* Maintenance toggle */}
          <div>
            <div style={{ fontSize: 10, letterSpacing: '.14em', color: '#a1a1aa', marginBottom: 12 }}>MAINTENANCE MODE</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, background: '#fafafa', border: '1px solid #e4e4e7', borderRadius: 9 }}>
              <button
                onClick={() => setMaintenance(!maintenance)}
                style={{ width: 48, height: 28, borderRadius: 14, border: 'none', background: maintenance ? '#059669' : '#d4d4d8', cursor: 'pointer', position: 'relative', transition: 'all .3s' }}
              >
                <div style={{ position: 'absolute', width: 24, height: 24, borderRadius: 12, background: '#fff', top: 2, left: maintenance ? 22 : 2, transition: 'left .3s' }} />
              </button>
              <div>
                <div style={{ fontSize: 12, fontWeight: 500, color: '#18181b' }}>{maintenance ? 'Enabled' : 'Disabled'}</div>
                <div style={{ fontSize: 10, color: '#a1a1aa', marginTop: 2 }}>{maintenance ? 'App in read-only mode' : 'System running normally'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
