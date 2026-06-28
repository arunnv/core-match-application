'use client';

import { useState } from 'react';

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

const ROLE_STYLE: Record<string, { color: string; bg: string; bd: string }> = {
  SuperAdmin:      { color: '#7c3aed', bg: '#f5f3ff', bd: '#ddd6fe' },
  TenantAdmin:     { color: '#0369a1', bg: '#eff6ff', bd: '#bfdbfe' },
  RecruitmentLead: { color: '#059669', bg: '#ecfdf5', bd: '#a7f3d0' },
  HiringManager:   { color: '#d97706', bg: '#fffbeb', bd: '#fde68a' },
  Recruiter:       { color: '#52525b', bg: '#f4f4f5', bd: '#e4e4e7' },
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

  const roleStyle = ROLE_STYLE[user.role] ?? ROLE_STYLE.Recruiter;
  const [copied, setCopied] = useState(false);

  const copyId = () => {
    navigator.clipboard.writeText(user.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div style={{ maxWidth: 720, padding: '80px 48px 90px 96px' }} className="animate-rise">
      {/* Header */}
      <div style={{ fontSize: 11, letterSpacing: '.22em', color: '#a1a1aa', marginBottom: 14 }}>COREMATCH / PROFILE</div>
      <h1 style={{ fontFamily: 'var(--font-space)', fontWeight: 300, fontSize: 44, lineHeight: 1, letterSpacing: '-.02em', margin: '0 0 36px' }}>
        My <span style={{ fontWeight: 600 }}>Profile</span>
      </h1>

      {/* Identity card */}
      <div style={{ background: '#fff', border: '1px solid #e4e4e7', borderRadius: 20, padding: '28px 28px 24px', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24 }}>
          {/* Avatar */}
          {user.image ? (
            <img src={user.image} alt={user.name} style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', border: '2px solid #e4e4e7' }} />
          ) : (
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#18181b', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-space)', fontWeight: 700, fontSize: 22, flexShrink: 0 }}>
              {initials}
            </div>
          )}
          <div>
            <div style={{ fontFamily: 'var(--font-space)', fontWeight: 700, fontSize: 22, color: '#18181b', marginBottom: 4 }}>{user.name || '—'}</div>
            <div style={{ fontSize: 13, color: '#71717a', marginBottom: 8 }}>{user.email}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 9.5, letterSpacing: '.14em', color: roleStyle.color, background: roleStyle.bg, border: `1px solid ${roleStyle.bd}`, padding: '3px 9px', borderRadius: 6 }}>
                {user.role.replace(/([A-Z])/g, ' $1').trim().toUpperCase()}
              </span>
              {!user.enabled && (
                <span style={{ fontSize: 9.5, letterSpacing: '.14em', color: '#ef4444', background: '#fef2f2', border: '1px solid #fecaca', padding: '3px 9px', borderRadius: 6 }}>
                  DISABLED
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Details grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <InfoRow label="Organisation" value={user.tenantName ?? '—'} />
          <InfoRow label="Member since" value={fmt(user.createdAt)} />
          <InfoRow label="Last login" value={user.lastLoginAt ? fmtTime(user.lastLoginAt) : 'Never'} />
          <InfoRow label="Evaluations credited" value={user.lifetimeCredits.toString()} mono />
        </div>
      </div>

      {/* Account ID */}
      <div style={{ background: '#fafafa', border: '1px solid #e4e4e7', borderRadius: 14, padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 9.5, letterSpacing: '.16em', color: '#a1a1aa', marginBottom: 4 }}>ACCOUNT ID</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#52525b' }}>{user.id}</div>
        </div>
        <button
          onClick={copyId}
          style={{ padding: '6px 13px', borderRadius: 8, border: '1px solid #e4e4e7', background: copied ? '#ecfdf5' : '#fff', color: copied ? '#059669' : '#71717a', fontFamily: 'var(--font-mono)', fontSize: 11, cursor: 'pointer', transition: 'all .2s', whiteSpace: 'nowrap' }}
        >
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      </div>
    </div>
  );
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ background: '#fafafa', border: '1px solid #f1f1f2', borderRadius: 10, padding: '12px 14px' }}>
      <div style={{ fontSize: 9.5, letterSpacing: '.14em', color: '#a1a1aa', marginBottom: 5 }}>{label.toUpperCase()}</div>
      <div style={{ fontSize: 13, color: '#18181b', fontFamily: mono ? 'var(--font-mono)' : undefined }}>{value}</div>
    </div>
  );
}
