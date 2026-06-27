'use client';

import { useState } from 'react';
import Link from 'next/link';

type User = { id: string; name: string; role: string; lastLogin: string; credits: number; enabled: boolean };

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

  const toggleUser = async (id: string) => {
    const user = users.find((u) => u.id === id);
    if (!user) return;
    const newEnabled = !user.enabled;
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, enabled: newEnabled } : u)));
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: newEnabled }),
      });
      if (!res.ok) {
        setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, enabled: user.enabled } : u)));
      }
    } catch {
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, enabled: user.enabled } : u)));
    }
  };

  const drawerUser = users.find((u) => u.id === drawerId) ?? null;
  const topConsumers = [...users].sort((a, b) => b.credits - a.credits).slice(0, 3);
  const maxCredits = Math.max(...users.map((u) => u.credits), 1);

  const formatNumber = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n);

  return (
    <>
      <div style={{ maxWidth: 1400, padding: '80px 48px 90px 96px' }} className="animate-rise">
        {/* Header + nav */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24, marginBottom: 28 }}>
          <div>
            <div style={{ fontSize: 11, letterSpacing: '.22em', color: '#a1a1aa', marginBottom: 14 }}>SYSTEM / USERS_AND_USAGE</div>
            <h1 style={{ fontFamily: 'var(--font-space)', fontWeight: 300, fontSize: 44, lineHeight: 1, letterSpacing: '-.02em', margin: 0 }}>
              User Management <span style={{ fontWeight: 600 }}>&amp; Credits</span>
            </h1>
          </div>
          <div style={{ display: 'flex', gap: 8, paddingBottom: 6 }}>
            <Link href="/admin" style={{ padding: '8px 16px', borderRadius: 9, border: '1px solid #e4e4e7', background: '#fff', color: '#71717a', fontFamily: 'var(--font-mono)', fontSize: 12, cursor: 'pointer', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>Cockpit</Link>
            <button style={{ padding: '8px 16px', borderRadius: 9, border: 'none', background: '#18181b', color: '#fff', fontFamily: 'var(--font-mono)', fontSize: 12, cursor: 'pointer' }}>Users &amp; Usage</button>
          </div>
        </div>

        {/* Metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 28 }}>
          {[
            { label: 'TOTAL SIGN-UPS', value: totalSignUps.toLocaleString(), sub: `${users.filter(u => u.enabled).length} active`, dot: false },
            { label: 'ACTIVE ACCOUNTS', value: users.filter(u => u.enabled).length.toString(), sub: 'Enabled users', subColor: '#059669' as string | undefined, dot: true },
            { label: 'TOTAL CREDITS USED', value: formatNumber(totalCreditsUsed), sub: 'Lifetime across all users', subColor: '#d97706' as string | undefined, dot: false },
          ].map(({ label, value, sub, subColor, dot }) => (
            <div key={label} style={{ background: '#fff', border: '1px solid #e4e4e7', borderRadius: 14, padding: 20, boxShadow: '0 1px 2px rgba(24,24,27,.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                {dot && <span className="pulse-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />}
                <span style={{ fontSize: 9.5, letterSpacing: '.16em', color: '#a1a1aa' }}>{label}</span>
              </div>
              <div style={{ fontFamily: 'var(--font-space)', fontWeight: 300, fontSize: 28, color: '#18181b', marginBottom: 8 }}>{value}</div>
              <div style={{ fontSize: 10, color: subColor ?? '#a1a1aa' }}>{sub}</div>
            </div>
          ))}
        </div>

        {/* Table + consumers */}
        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 24 }}>
          {/* Top consumers */}
          <div style={{ background: '#fff', border: '1px solid #e4e4e7', borderRadius: 14, padding: 20, boxShadow: '0 1px 2px rgba(24,24,27,.04)', height: 'fit-content' }}>
            <div style={{ fontFamily: 'var(--font-space)', fontWeight: 600, fontSize: 14, color: '#18181b', marginBottom: 18 }}>Top AI Credit Consumers</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {topConsumers.map((c) => {
                const pct = (c.credits / maxCredits) * 100;
                return (
                  <div key={c.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 500, color: '#18181b' }}>{c.name}</span>
                      <span style={{ fontSize: 10, color: '#52525b', fontVariantNumeric: 'tabular-nums' }}>{c.credits.toLocaleString()}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1, height: 6, borderRadius: 3, background: '#f1f1f2', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: pct > 70 ? '#d97706' : '#a7f3d0', transition: 'all .3s' }} />
                      </div>
                      <span style={{ fontSize: 9, color: '#a1a1aa', width: 26 }}>{Math.round(pct)}%</span>
                    </div>
                  </div>
                );
              })}
              {topConsumers.length === 0 && (
                <div style={{ fontSize: 12, color: '#a1a1aa', textAlign: 'center', padding: '20px 0' }}>No data yet</div>
              )}
            </div>
          </div>

          {/* User directory */}
          <div style={{ background: '#fff', border: '1px solid #e4e4e7', borderRadius: 14, padding: 20, boxShadow: '0 1px 2px rgba(24,24,27,.04)' }}>
            <div style={{ fontFamily: 'var(--font-space)', fontWeight: 600, fontSize: 16, color: '#18181b', marginBottom: 18 }}>Global User Directory</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1.2fr 120px 140px 100px 80px', gap: 16, padding: '12px 0', borderBottom: '2px solid #e4e4e7', fontSize: 9.5, letterSpacing: '.12em', color: '#a1a1aa', fontWeight: 500 }}>
              <div>User Name</div><div>Role</div><div>Last Login</div><div>Lifetime Credits</div><div>Status</div><div>Toggle</div>
            </div>
            {users.map((u) => (
              <div
                key={u.id}
                style={{ display: 'grid', gridTemplateColumns: '1.4fr 1.2fr 120px 140px 100px 80px', gap: 16, alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f1f1f2', cursor: 'pointer' }}
                className="hover:bg-[#fafafa]"
              >
                <div onClick={() => setDrawerId(u.id)} style={{ color: '#18181b', fontWeight: 500, fontSize: 12.5 }}>{u.name}</div>
                <div style={{ color: '#52525b', fontSize: 12 }}>{u.role}</div>
                <div style={{ color: '#a1a1aa', fontSize: 11 }}>{u.lastLogin}</div>
                <div style={{ color: '#18181b', fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}>{u.credits.toLocaleString()}</div>
                <div>
                  <span style={{ fontSize: 9, letterSpacing: '.12em', color: u.enabled ? '#059669' : '#71717a', background: u.enabled ? '#ecfdf5' : '#f4f4f5', border: `1px solid ${u.enabled ? '#a7f3d0' : '#e4e4e7'}`, padding: '3px 9px', borderRadius: 5 }}>
                    {u.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <button
                    onClick={(e) => { e.stopPropagation(); void toggleUser(u.id); }}
                    style={{ width: 40, height: 24, borderRadius: 12, border: 'none', background: u.enabled ? '#059669' : '#d4d4d8', cursor: 'pointer', position: 'relative', transition: 'all .3s' }}
                  >
                    <div style={{ position: 'absolute', width: 20, height: 20, borderRadius: 10, background: '#fff', top: 2, left: u.enabled ? 18 : 2, transition: 'left .3s' }} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* User detail drawer */}
      {drawerUser && (
        <>
          <div onClick={() => setDrawerId(null)} style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(24,24,27,.14)', backdropFilter: 'blur(1.5px)' }} className="animate-rise" />
          <div className="cm-scroll animate-drawerin" style={{ position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 61, width: 420, maxWidth: '94vw', background: '#fff', borderLeft: '1px solid #e4e4e7', boxShadow: '-30px 0 60px -30px rgba(24,24,27,.3)', overflowY: 'auto' }}>
            <div style={{ position: 'sticky', top: 0, background: 'rgba(255,255,255,.9)', backdropFilter: 'blur(8px)', borderBottom: '1px solid #f1f1f2', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 11, letterSpacing: '.2em', color: '#a1a1aa' }}>USER ACCOUNT</div>
              <button onClick={() => setDrawerId(null)} style={{ width: 32, height: 32, borderRadius: 10, border: '1px solid #e4e4e7', background: '#fff', color: '#71717a', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>✕</button>
            </div>
            <div style={{ padding: 24 }}>
              <div style={{ fontFamily: 'var(--font-space)', fontWeight: 600, fontSize: 20, color: '#18181b', marginBottom: 6 }}>{drawerUser.name}</div>
              <div style={{ fontSize: 12, color: '#a1a1aa', marginBottom: 20 }}>{drawerUser.role}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '16px 0', borderTop: '1px solid #f1f1f2', borderBottom: '1px solid #f1f1f2' }}>
                <div><span style={{ fontSize: 10, color: '#a1a1aa', letterSpacing: '.12em' }}>LAST LOGIN</span><div style={{ fontSize: 13, color: '#18181b', marginTop: 4 }}>{drawerUser.lastLogin}</div></div>
                <div><span style={{ fontSize: 10, color: '#a1a1aa', letterSpacing: '.12em' }}>LIFETIME CREDITS</span><div style={{ fontFamily: 'var(--font-space)', fontWeight: 600, fontSize: 20, color: '#18181b', marginTop: 4 }}>{drawerUser.credits.toLocaleString()}</div></div>
                <div><span style={{ fontSize: 10, color: '#a1a1aa', letterSpacing: '.12em' }}>ACCOUNT STATUS</span><div style={{ fontSize: 13, color: '#18181b', marginTop: 4 }}>{drawerUser.enabled ? 'Active' : 'Suspended'}</div></div>
              </div>
              {/* Sparkline placeholder */}
              <div style={{ margin: '24px 0', padding: 16, background: '#fafafa', borderRadius: 10, height: 120, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', gap: 4 }}>
                {[30, 50, 40, 60, 45].map((h, i) => (
                  <div key={i} style={{ flex: 1, height: `${h}%`, background: h > 44 ? '#10b981' : '#d4d4d8', borderRadius: 2 }} />
                ))}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 20 }}>
                <button
                  onClick={() => void toggleUser(drawerUser.id)}
                  style={{ width: '100%', padding: 12, borderRadius: 11, fontFamily: 'var(--font-mono)', fontSize: 12.5, cursor: 'pointer', border: 'none', background: drawerUser.enabled ? '#fee2e2' : '#ecfdf5', color: drawerUser.enabled ? '#991b1b' : '#065f46', fontWeight: 500 }}
                >
                  {drawerUser.enabled ? 'Suspend User Account' : 'Reactivate Account'}
                </button>
                <button style={{ width: '100%', padding: 12, border: '1px solid #e4e4e7', borderRadius: 11, background: '#fff', color: '#71717a', fontFamily: 'var(--font-mono)', fontSize: 12.5, cursor: 'pointer' }}>Reset API Keys</button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
