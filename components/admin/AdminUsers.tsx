'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

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
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
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
      <style>{`
        .au-wrap { padding: 72px 16px 80px; max-width: 1400px; }
        .au-header { display: flex; flex-direction: column; gap: 16px; margin-bottom: 24px; }
        .au-nav { display: flex; gap: 8px; }
        .au-metrics { display: grid; grid-template-columns: 1fr; gap: 12px; margin-bottom: 20px; }
        .au-body { display: grid; grid-template-columns: 1fr; gap: 16px; }
        .au-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
        .au-table { display: grid; min-width: 560px; }
        .au-table-head { display: grid; grid-template-columns: 1.4fr 1fr 100px 110px 90px 70px; gap: 12px; padding: 10px 0; border-bottom: 2px solid #e4e4e7; font-size: 9px; letter-spacing: .12em; color: #a1a1aa; font-weight: 500; }
        .au-table-row { display: grid; grid-template-columns: 1.4fr 1fr 100px 110px 90px 70px; gap: 12px; align-items: center; padding: 10px 0; border-bottom: 1px solid #f1f1f2; cursor: pointer; }
        .au-card { background: #fff; border: 1px solid #e4e4e7; border-radius: 14px; padding: 18px; box-shadow: 0 1px 2px rgba(24,24,27,.04); }
        .log-row { display: grid; grid-template-columns: 90px 1fr 70px 52px; gap: 8px; align-items: center; padding: 7px 0; border-bottom: 1px solid #f4f4f5; }
        .log-row:last-child { border-bottom: none; }

        @media (min-width: 640px) {
          .au-wrap { padding: 72px 24px 80px; }
          .au-metrics { grid-template-columns: repeat(3, 1fr); gap: 14px; }
        }

        @media (min-width: 900px) {
          .au-wrap { padding: 80px 32px 90px 96px; }
          .au-header { flex-direction: row; align-items: flex-end; justify-content: space-between; }
          .au-body { grid-template-columns: 260px 1fr; }
          .au-table-head { grid-template-columns: 1.4fr 1.2fr 110px 130px 90px 70px; gap: 14px; font-size: 9.5px; }
          .au-table-row { grid-template-columns: 1.4fr 1.2fr 110px 130px 90px 70px; gap: 14px; }
          .au-table { min-width: unset; }
        }
      `}</style>

      <div className="au-wrap animate-rise">
        {/* Header */}
        <div className="au-header">
          <div>
            <div style={{ fontSize: 11, letterSpacing: '.22em', color: '#a1a1aa', marginBottom: 12 }}>SYSTEM / USERS_AND_USAGE</div>
            <h1 style={{ fontFamily: 'var(--font-space)', fontWeight: 300, fontSize: 'clamp(28px, 5vw, 44px)', lineHeight: 1, letterSpacing: '-.02em', margin: 0 }}>
              User Management <span style={{ fontWeight: 600 }}>&amp; Credits</span>
            </h1>
          </div>
          <div className="au-nav">
            <Link href="/admin" style={{ padding: '8px 14px', borderRadius: 9, border: '1px solid #e4e4e7', background: '#fff', color: '#71717a', fontFamily: 'var(--font-mono)', fontSize: 12, cursor: 'pointer', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>Cockpit</Link>
            <button style={{ padding: '8px 14px', borderRadius: 9, border: 'none', background: '#18181b', color: '#fff', fontFamily: 'var(--font-mono)', fontSize: 12, cursor: 'pointer' }}>Users &amp; Usage</button>
          </div>
        </div>

        {/* Metrics */}
        <div className="au-metrics">
          {[
            { label: 'TOTAL SIGN-UPS', value: totalSignUps.toLocaleString(), sub: `${users.filter(u => u.enabled).length} active`, dot: false, subColor: undefined as string | undefined },
            { label: 'ACTIVE ACCOUNTS', value: users.filter(u => u.enabled).length.toString(), sub: 'Enabled users', subColor: '#059669' as string | undefined, dot: true },
            { label: 'TOTAL CREDITS USED', value: formatNumber(totalCreditsUsed), sub: 'Lifetime across all users', subColor: '#d97706' as string | undefined, dot: false },
          ].map(({ label, value, sub, subColor, dot }) => (
            <div key={label} className="au-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                {dot && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', flexShrink: 0 }} />}
                <span style={{ fontSize: 9.5, letterSpacing: '.16em', color: '#a1a1aa' }}>{label}</span>
              </div>
              <div style={{ fontFamily: 'var(--font-space)', fontWeight: 300, fontSize: 'clamp(22px, 4vw, 28px)', color: '#18181b', marginBottom: 6 }}>{value}</div>
              <div style={{ fontSize: 10, color: subColor ?? '#a1a1aa' }}>{sub}</div>
            </div>
          ))}
        </div>

        {/* Body */}
        <div className="au-body">
          {/* Top consumers */}
          <div className="au-card" style={{ height: 'fit-content' }}>
            <div style={{ fontFamily: 'var(--font-space)', fontWeight: 600, fontSize: 14, color: '#18181b', marginBottom: 16 }}>Top AI Credit Consumers</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {topConsumers.map((c) => {
                const pct = (c.credits / maxCredits) * 100;
                return (
                  <div key={c.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontSize: 12, fontWeight: 500, color: '#18181b' }}>{c.name}</span>
                      <span style={{ fontSize: 10, color: '#52525b' }}>{c.credits.toLocaleString()}</span>
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
                <div style={{ fontSize: 12, color: '#a1a1aa', textAlign: 'center', padding: '16px 0' }}>No data yet</div>
              )}
            </div>
          </div>

          {/* User directory */}
          <div className="au-card">
            <div style={{ fontFamily: 'var(--font-space)', fontWeight: 600, fontSize: 15, color: '#18181b', marginBottom: 16 }}>Global User Directory</div>
            <div className="au-table-wrap">
              <div className="au-table">
                <div className="au-table-head">
                  <div>User Name</div><div>Role</div><div>Last Login</div><div>Credits</div><div>Status</div><div>Toggle</div>
                </div>
                {users.map((u) => (
                  <div key={u.id} className="au-table-row" onClick={() => setDrawerId(u.id)}>
                    <div style={{ color: '#18181b', fontWeight: 500, fontSize: 12.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name}</div>
                    <div style={{ color: '#52525b', fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.role}</div>
                    <div style={{ color: '#a1a1aa', fontSize: 11 }}>{u.lastLogin}</div>
                    <div style={{ color: '#18181b', fontVariantNumeric: 'tabular-nums', fontWeight: 500, fontSize: 12 }}>{u.credits.toLocaleString()}</div>
                    <div>
                      <span style={{ fontSize: 9, letterSpacing: '.1em', color: u.enabled ? '#059669' : '#71717a', background: u.enabled ? '#ecfdf5' : '#f4f4f5', border: `1px solid ${u.enabled ? '#a7f3d0' : '#e4e4e7'}`, padding: '3px 7px', borderRadius: 5, whiteSpace: 'nowrap' }}>
                        {u.enabled ? 'On' : 'Off'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); void toggleUser(u.id); }}
                        style={{ width: 40, height: 24, borderRadius: 12, border: 'none', background: u.enabled ? '#059669' : '#d4d4d8', cursor: 'pointer', position: 'relative', transition: 'all .3s', flexShrink: 0 }}
                        aria-label={u.enabled ? 'Disable user' : 'Enable user'}
                      >
                        <div style={{ position: 'absolute', width: 20, height: 20, borderRadius: 10, background: '#fff', top: 2, left: u.enabled ? 18 : 2, transition: 'left .3s' }} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* User detail drawer */}
      {drawerUser && (
        <>
          <div onClick={() => setDrawerId(null)} style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(24,24,27,.14)', backdropFilter: 'blur(1.5px)' }} />
          <div className="cm-scroll" style={{ position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 61, width: 'min(440px, 100vw)', background: '#fff', borderLeft: '1px solid #e4e4e7', boxShadow: '-30px 0 60px -30px rgba(24,24,27,.3)', overflowY: 'auto' }}>
            {/* Drawer header */}
            <div style={{ position: 'sticky', top: 0, background: 'rgba(255,255,255,.92)', backdropFilter: 'blur(10px)', borderBottom: '1px solid #f1f1f2', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 1 }}>
              <div style={{ fontSize: 11, letterSpacing: '.2em', color: '#a1a1aa' }}>USER ACCOUNT</div>
              <button onClick={() => setDrawerId(null)} style={{ width: 32, height: 32, borderRadius: 10, border: '1px solid #e4e4e7', background: '#fff', color: '#71717a', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>✕</button>
            </div>

            <div style={{ padding: '20px 20px 40px' }}>
              {/* Identity */}
              <div style={{ fontFamily: 'var(--font-space)', fontWeight: 600, fontSize: 20, color: '#18181b', marginBottom: 4 }}>{drawerUser.name}</div>
              <div style={{ fontSize: 12, color: '#a1a1aa', marginBottom: 20 }}>{drawerUser.role}</div>

              {/* Stats */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '16px 0', borderTop: '1px solid #f1f1f2', borderBottom: '1px solid #f1f1f2' }}>
                <div>
                  <span style={{ fontSize: 10, color: '#a1a1aa', letterSpacing: '.12em' }}>LAST LOGIN</span>
                  <div style={{ fontSize: 13, color: '#18181b', marginTop: 4 }}>{drawerUser.lastLogin}</div>
                </div>
                <div>
                  <span style={{ fontSize: 10, color: '#a1a1aa', letterSpacing: '.12em' }}>LIFETIME CREDITS</span>
                  <div style={{ fontFamily: 'var(--font-space)', fontWeight: 600, fontSize: 20, color: '#18181b', marginTop: 4 }}>{drawerUser.credits.toLocaleString()}</div>
                </div>
                <div>
                  <span style={{ fontSize: 10, color: '#a1a1aa', letterSpacing: '.12em' }}>ACCOUNT STATUS</span>
                  <div style={{ fontSize: 13, color: '#18181b', marginTop: 4 }}>{drawerUser.enabled ? 'Active' : 'Suspended'}</div>
                </div>
              </div>

              {/* ── LOGIN HISTORY ── */}
              <div style={{ marginTop: 20, paddingBottom: 20, borderBottom: '1px solid #f1f1f2' }}>
                <div style={{ fontSize: 10, color: '#a1a1aa', letterSpacing: '.12em', marginBottom: 10 }}>LOGIN HISTORY</div>

                {logsLoading ? (
                  <div style={{ fontSize: 11, color: '#a1a1aa', padding: '12px 0' }}>Loading…</div>
                ) : authLogs.length === 0 ? (
                  <div style={{ fontSize: 11, color: '#a1a1aa', padding: '12px 0' }}>No login events recorded yet.</div>
                ) : (
                  <div style={{ maxHeight: 192, overflowY: 'auto' }}>
                    {/* Column headers */}
                    <div className="log-row" style={{ borderBottom: '1px solid #e4e4e7', paddingBottom: 6, marginBottom: 2 }}>
                      {['TIMESTAMP', 'IP ADDRESS', 'METHOD', 'STATUS'].map((h) => (
                        <div key={h} style={{ fontSize: 8.5, letterSpacing: '.1em', color: '#a1a1aa', fontWeight: 500 }}>{h}</div>
                      ))}
                    </div>
                    {authLogs.map((log) => (
                      <div key={log.id} className="log-row">
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#52525b', whiteSpace: 'nowrap' }}>
                          {fmtTs(log.createdAt)}
                        </div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#71717a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {log.ipAddress ?? '—'}
                        </div>
                        <div style={{ fontSize: 10, color: '#52525b' }}>
                          {log.authMethod === 'Google SSO'
                            ? <span style={{ color: '#2563eb' }}>Google</span>
                            : <span style={{ color: '#71717a' }}>{fmtUA(log.userAgent)}</span>}
                        </div>
                        <div>
                          <span style={{
                            fontSize: 8.5, letterSpacing: '.08em', fontWeight: 500,
                            color: log.status === 'Success' ? '#059669' : '#dc2626',
                            background: log.status === 'Success' ? '#ecfdf5' : '#fef2f2',
                            border: `1px solid ${log.status === 'Success' ? '#a7f3d0' : '#fecaca'}`,
                            padding: '2px 6px', borderRadius: 4,
                          }}>
                            {log.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 20 }}>
                <button
                  onClick={() => void toggleUser(drawerUser.id)}
                  style={{ width: '100%', padding: 13, borderRadius: 11, fontFamily: 'var(--font-mono)', fontSize: 13, cursor: 'pointer', border: 'none', background: drawerUser.enabled ? '#fee2e2' : '#ecfdf5', color: drawerUser.enabled ? '#991b1b' : '#065f46', fontWeight: 500 }}
                >
                  {drawerUser.enabled ? 'Suspend User Account' : 'Reactivate Account'}
                </button>
                <button style={{ width: '100%', padding: 13, border: '1px solid #e4e4e7', borderRadius: 11, background: '#fff', color: '#71717a', fontFamily: 'var(--font-mono)', fontSize: 13, cursor: 'pointer' }}>Reset API Keys</button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
