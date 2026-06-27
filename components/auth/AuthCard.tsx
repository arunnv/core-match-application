'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';

type Mode = 'login' | 'signup';

export default function AuthCard() {
  const [mode, setMode] = useState<Mode>('login');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({ name: '', email: '', password: '', company: '' });
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    const res = await signIn('credentials', {
      email: form.email,
      password: form.password,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError('Invalid email or password.');
    } else {
      window.location.href = '/jobs';
    }
  };

  const handleSignup = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, email: form.email, password: form.password, company: form.company || undefined }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) { setError(data.error ?? 'Registration failed.'); setLoading(false); return; }
      // Auto sign-in after register
      await signIn('credentials', { email: form.email, password: form.password, redirect: false });
      window.location.href = '/jobs';
    } catch {
      setError('Something went wrong.');
    }
    setLoading(false);
  };

  const tabStyle = (active: boolean): React.CSSProperties => ({
    flex: 1, border: 'none', borderRadius: 7, padding: 8, fontFamily: 'var(--font-mono)', fontSize: 12, cursor: 'pointer', transition: 'all .2s',
    background: active ? '#fff' : 'transparent', color: active ? '#18181b' : '#a1a1aa',
    boxShadow: active ? '0 1px 2px rgba(24,24,27,.06)' : 'none',
  });

  const inputWrap: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 10, background: '#fff', border: '1px solid #e4e4e7',
    borderRadius: 11, padding: '0 13px', height: 44, marginBottom: 10, transition: 'border-color .2s',
  };
  const inputStyle: React.CSSProperties = {
    flex: 1, border: 'none', background: 'transparent', outline: 'none',
    fontFamily: 'var(--font-mono)', fontSize: 12.5, color: '#18181b',
  };

  return (
    <div style={{ width: 440, maxWidth: '100%', background: '#fff', border: '1px solid #e4e4e7', borderRadius: 18, boxShadow: '0 1px 2px rgba(24,24,27,.04)', padding: 40 }} className="animate-rise">
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
        <div style={{ width: 36, height: 36, borderRadius: 12, background: '#18181b', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <div style={{ width: 12, height: 12, background: '#10b981', transform: 'rotate(45deg)', borderRadius: 2 }} />
        </div>
        <span style={{ fontFamily: 'var(--font-space)', fontWeight: 700, fontSize: 17, letterSpacing: '-.01em', color: '#18181b' }}>CoreMatch</span>
      </div>

      {/* Mode toggle */}
      <div style={{ display: 'flex', gap: 8, background: '#f4f4f5', padding: 4, borderRadius: 9, marginBottom: 28 }}>
        <button onClick={() => { setMode('login'); setError(''); }} style={tabStyle(mode === 'login')}>Sign In</button>
        <button onClick={() => { setMode('signup'); setError(''); }} style={tabStyle(mode === 'signup')}>Sign Up</button>
      </div>

      {/* Heading */}
      {mode === 'login' ? (
        <h1 style={{ fontFamily: 'var(--font-space)', fontWeight: 600, fontSize: 28, lineHeight: 1, letterSpacing: '-.02em', margin: '0 0 24px', color: '#18181b' }}>Sign In</h1>
      ) : (
        <>
          <h1 style={{ fontFamily: 'var(--font-space)', fontWeight: 300, fontSize: 32, lineHeight: 1, letterSpacing: '-.02em', margin: '0 0 10px', color: '#18181b' }}>Get <span style={{ fontWeight: 600 }}>Started</span></h1>
          <div style={{ fontSize: 12, color: '#a1a1aa', marginBottom: 30 }}>Already have an account?{' '}
            <button onClick={() => { setMode('login'); setError(''); }} style={{ background: 'none', border: 'none', color: '#059669', cursor: 'pointer', fontWeight: 500, padding: 0, fontFamily: 'var(--font-mono)' }}>Sign In</button>
          </div>
        </>
      )}

      {/* SSO */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button
          onClick={() => signIn('google', { callbackUrl: '/jobs' })}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, width: '100%', background: '#f4f4f5', color: '#18181b', border: '1px solid #e4e4e7', padding: 12, borderRadius: 11, fontFamily: 'var(--font-mono)', fontSize: 13, cursor: 'pointer' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.06 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h6.2a5.3 5.3 0 0 1-2.3 3.48v2.89h3.72c2.18-2 3.44-4.96 3.44-8.38z"/><path fill="#34A853" d="M12 24c3.1 0 5.7-1.03 7.6-2.78l-3.72-2.89c-1.03.69-2.35 1.1-3.88 1.1-2.98 0-5.5-2.01-6.4-4.72H1.76v2.98A11.5 11.5 0 0 0 12 24z"/><path fill="#FBBC05" d="M5.6 14.71A6.9 6.9 0 0 1 5.23 12c0-.94.16-1.86.37-2.71V6.31H1.76A11.5 11.5 0 0 0 .5 12c0 1.86.45 3.62 1.26 5.69l3.84-2.98z"/><path fill="#EA4335" d="M12 4.77c1.68 0 3.2.58 4.39 1.72l3.29-3.29C17.7 1.18 15.1 0 12 0A11.5 11.5 0 0 0 1.76 6.31l3.84 2.98C6.5 6.78 9.02 4.77 12 4.77z"/></svg>
          Continue with Google
        </button>
      </div>

      {/* Divider */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, margin: '24px 0' }}>
        <div style={{ flex: 1, height: 1, background: '#ececed' }} />
        <span style={{ fontSize: 9.5, letterSpacing: '.16em', color: '#a1a1aa', whiteSpace: 'nowrap' }}>OR CONTINUE WITH EMAIL</span>
        <div style={{ flex: 1, height: 1, background: '#ececed' }} />
      </div>

      {/* Error */}
      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 9, padding: '10px 14px', marginBottom: 14, fontSize: 12, color: '#b91c1c' }}>{error}</div>
      )}

      {/* Sign-up extras */}
      {mode === 'signup' && (
        <>
          <div style={inputWrap}>
            <svg width="15" height="15" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="7" r="3" stroke="#a1a1aa" strokeWidth="1.5"/><path d="M3 17c0-2.2 3-3.5 7-3.5s7 1.3 7 3.5" stroke="#a1a1aa" strokeWidth="1.5"/></svg>
            <input type="text" placeholder="Full name" value={form.name} onChange={set('name')} style={inputStyle} />
          </div>
          <div style={inputWrap}>
            <svg width="15" height="15" viewBox="0 0 20 20" fill="none"><rect x="2" y="5" width="16" height="13" rx="2" stroke="#a1a1aa" strokeWidth="1.5"/><path d="M2 8h16M8 5V3h4v2" stroke="#a1a1aa" strokeWidth="1.5"/></svg>
            <input type="text" placeholder="Company name (optional)" value={form.company} onChange={set('company')} style={inputStyle} />
          </div>
        </>
      )}

      {/* Email */}
      <div style={inputWrap}>
        <svg width="15" height="15" viewBox="0 0 20 20" fill="none"><rect x="2.5" y="4.5" width="15" height="11" rx="2" stroke="#a1a1aa" strokeWidth="1.5"/><path d="M3 6l7 4.5L17 6" stroke="#a1a1aa" strokeWidth="1.5"/></svg>
        <input type="email" placeholder="you@company.com" value={form.email} onChange={set('email')} style={inputStyle} />
      </div>

      {/* Password */}
      <div style={inputWrap}>
        <svg width="15" height="15" viewBox="0 0 20 20" fill="none"><rect x="3.5" y="8.5" width="13" height="8" rx="2" stroke="#a1a1aa" strokeWidth="1.5"/><path d="M6.5 8.5V6a3.5 3.5 0 0 1 7 0v2.5" stroke="#a1a1aa" strokeWidth="1.5"/></svg>
        <input type={showPw ? 'text' : 'password'} placeholder={mode === 'login' ? 'Enter password' : 'Create password (min 8 chars)'} value={form.password} onChange={set('password')} style={inputStyle} />
        <button onClick={() => setShowPw(!showPw)} style={{ border: 'none', background: 'transparent', color: '#71717a', fontFamily: 'var(--font-mono)', fontSize: 11, cursor: 'pointer', padding: '4px 6px' }}>
          {showPw ? 'Hide' : 'Show'}
        </button>
      </div>

      {mode === 'login' && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8, marginBottom: 20 }}>
          <span style={{ fontSize: 11, color: '#71717a', cursor: 'pointer' }}>Forgot Password?</span>
        </div>
      )}
      {mode === 'signup' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '12px 0 20px' }}>
          <input type="checkbox" id="terms" style={{ width: 16, height: 16, cursor: 'pointer' }} />
          <label htmlFor="terms" style={{ fontSize: 11, color: '#71717a', cursor: 'pointer' }}>I agree to the <span style={{ color: '#059669' }}>Terms of Service</span></label>
        </div>
      )}

      <button
        onClick={mode === 'login' ? handleLogin : handleSignup}
        disabled={loading}
        style={{ width: '100%', background: loading ? '#d4d4d8' : '#18181b', color: '#fff', border: 'none', padding: 12, borderRadius: 11, fontFamily: 'var(--font-mono)', fontSize: 13, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, transition: 'all .2s' }}
      >
        {loading ? 'Please wait…' : mode === 'login' ? <>Secure Login <span>→</span></> : <>Create Account <span>→</span></>}
      </button>

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 24, paddingTop: 20, borderTop: '1px solid #ececed', fontSize: 10, color: '#a1a1aa' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <svg width="10" height="10" viewBox="0 0 16 16" fill="none"><path d="M8 1.5l5.5 2.2v3.6c0 3.4-2.3 6.2-5.5 7.2-3.2-1-5.5-3.8-5.5-7.2V3.7L8 1.5z" stroke="#a1a1aa" strokeWidth="1.2" strokeLinejoin="round"/></svg>
          Encrypted
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ color: '#71717a', cursor: 'pointer' }}>Privacy Policy</span>
          <span style={{ color: '#d4d4d8' }}>·</span>
          <span style={{ color: '#059669', cursor: 'pointer', fontWeight: 500 }}>Contact Sales</span>
        </span>
      </div>
    </div>
  );
}
