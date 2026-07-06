'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

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
    const res = await signIn('credentials', { email: form.email, password: form.password, redirect: false });
    setLoading(false);
    if (res?.error) setError('Invalid email or password.');
    else window.location.href = '/jobs';
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
      await signIn('credentials', { email: form.email, password: form.password, redirect: false });
      window.location.href = '/jobs';
    } catch {
      setError('Something went wrong.');
    }
    setLoading(false);
  };

  return (
    <div className="animate-rise w-[440px] max-w-full bg-card border border-border rounded-[18px] p-10 shadow-sm">
      {/* Brand */}
      <div className="flex items-center gap-2.5 mb-8">
        <div className="w-9 h-9 rounded-xl bg-foreground flex items-center justify-center shrink-0">
          <div className="w-3 h-3 bg-[var(--green)] rotate-45 rounded-[2px]" />
        </div>
        <span className="font-bold text-[17px] tracking-[-0.01em] text-foreground" style={{ fontFamily: 'var(--font-space)' }}>CoreMatch</span>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-2 bg-muted p-1 rounded-[9px] mb-7">
        {(['login', 'signup'] as const).map((m) => (
          <button
            key={m}
            onClick={() => { setMode(m); setError(''); }}
            className={cn(
              'flex-1 rounded-[7px] py-2 font-mono text-[12px] cursor-pointer border-none transition-all',
              mode === m ? 'bg-card text-foreground shadow-sm' : 'bg-transparent text-muted-foreground'
            )}
          >
            {m === 'login' ? 'Sign In' : 'Sign Up'}
          </button>
        ))}
      </div>

      {/* Heading */}
      {mode === 'login' ? (
        <h1 className="font-semibold text-[28px] leading-none tracking-[-0.02em] mb-6 text-foreground" style={{ fontFamily: 'var(--font-space)' }}>Sign In</h1>
      ) : (
        <>
          <h1 className="font-light text-[32px] leading-none tracking-[-0.02em] mb-2.5 text-foreground" style={{ fontFamily: 'var(--font-space)' }}>
            Get <span className="font-semibold">Started</span>
          </h1>
          <div className="text-[12px] text-muted-foreground mb-7">
            Already have an account?{' '}
            <button onClick={() => { setMode('login'); setError(''); }} className="bg-transparent border-none text-[var(--green)] cursor-pointer font-medium p-0 font-mono">Sign In</button>
          </div>
        </>
      )}

      {/* Google SSO */}
      <Button
        variant="outline"
        className="w-full gap-2.5 font-mono text-[13px] mb-0"
        onClick={() => signIn('google', { callbackUrl: '/jobs' })}
      >
        <svg width="16" height="16" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M23.06 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h6.2a5.3 5.3 0 0 1-2.3 3.48v2.89h3.72c2.18-2 3.44-4.96 3.44-8.38z"/>
          <path fill="#34A853" d="M12 24c3.1 0 5.7-1.03 7.6-2.78l-3.72-2.89c-1.03.69-2.35 1.1-3.88 1.1-2.98 0-5.5-2.01-6.4-4.72H1.76v2.98A11.5 11.5 0 0 0 12 24z"/>
          <path fill="#FBBC05" d="M5.6 14.71A6.9 6.9 0 0 1 5.23 12c0-.94.16-1.86.37-2.71V6.31H1.76A11.5 11.5 0 0 0 .5 12c0 1.86.45 3.62 1.26 5.69l3.84-2.98z"/>
          <path fill="#EA4335" d="M12 4.77c1.68 0 3.2.58 4.39 1.72l3.29-3.29C17.7 1.18 15.1 0 12 0A11.5 11.5 0 0 0 1.76 6.31l3.84 2.98C6.5 6.78 9.02 4.77 12 4.77z"/>
        </svg>
        Continue with Google
      </Button>

      {/* Divider */}
      <div className="flex items-center gap-3.5 my-6">
        <div className="flex-1 h-px bg-border" />
        <span className="text-[9.5px] tracking-[.16em] text-muted-foreground whitespace-nowrap">OR CONTINUE WITH EMAIL</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* Error */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-[9px] px-3.5 py-2.5 mb-3.5 text-[12px] text-destructive">{error}</div>
      )}

      {/* Sign-up extras */}
      {mode === 'signup' && (
        <>
          <div className="flex items-center gap-2.5 bg-card border border-border rounded-[11px] px-3 h-11 mb-2.5 transition-colors focus-within:border-muted-foreground/40">
            <svg width="15" height="15" viewBox="0 0 20 20" fill="none" className="text-muted-foreground shrink-0"><circle cx="10" cy="7" r="3" stroke="currentColor" strokeWidth="1.5"/><path d="M3 17c0-2.2 3-3.5 7-3.5s7 1.3 7 3.5" stroke="currentColor" strokeWidth="1.5"/></svg>
            <input type="text" placeholder="Full name" value={form.name} onChange={set('name')} className="flex-1 border-none bg-transparent outline-none font-mono text-[12.5px] text-foreground placeholder:text-muted-foreground" />
          </div>
          <div className="flex items-center gap-2.5 bg-card border border-border rounded-[11px] px-3 h-11 mb-2.5 transition-colors focus-within:border-muted-foreground/40">
            <svg width="15" height="15" viewBox="0 0 20 20" fill="none" className="text-muted-foreground shrink-0"><rect x="2" y="5" width="16" height="13" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M2 8h16M8 5V3h4v2" stroke="currentColor" strokeWidth="1.5"/></svg>
            <input type="text" placeholder="Company name (optional)" value={form.company} onChange={set('company')} className="flex-1 border-none bg-transparent outline-none font-mono text-[12.5px] text-foreground placeholder:text-muted-foreground" />
          </div>
        </>
      )}

      {/* Email */}
      <div className="flex items-center gap-2.5 bg-card border border-border rounded-[11px] px-3 h-11 mb-2.5 transition-colors focus-within:border-muted-foreground/40">
        <svg width="15" height="15" viewBox="0 0 20 20" fill="none" className="text-muted-foreground shrink-0"><rect x="2.5" y="4.5" width="15" height="11" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M3 6l7 4.5L17 6" stroke="currentColor" strokeWidth="1.5"/></svg>
        <input type="email" placeholder="you@company.com" value={form.email} onChange={set('email')} className="flex-1 border-none bg-transparent outline-none font-mono text-[12.5px] text-foreground placeholder:text-muted-foreground" />
      </div>

      {/* Password */}
      <div className="flex items-center gap-2.5 bg-card border border-border rounded-[11px] px-3 h-11 mb-2.5 transition-colors focus-within:border-muted-foreground/40">
        <svg width="15" height="15" viewBox="0 0 20 20" fill="none" className="text-muted-foreground shrink-0"><rect x="3.5" y="8.5" width="13" height="8" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M6.5 8.5V6a3.5 3.5 0 0 1 7 0v2.5" stroke="currentColor" strokeWidth="1.5"/></svg>
        <input
          type={showPw ? 'text' : 'password'}
          placeholder={mode === 'login' ? 'Enter password' : 'Create password (min 8 chars)'}
          value={form.password}
          onChange={set('password')}
          className="flex-1 border-none bg-transparent outline-none font-mono text-[12.5px] text-foreground placeholder:text-muted-foreground"
        />
        <button onClick={() => setShowPw(!showPw)} className="border-none bg-transparent text-muted-foreground font-mono text-[11px] cursor-pointer px-1 py-0.5 hover:text-foreground transition-colors">
          {showPw ? 'Hide' : 'Show'}
        </button>
      </div>

      {mode === 'login' && (
        <div className="flex justify-end mt-2 mb-5">
          <span className="text-[11px] text-muted-foreground cursor-pointer hover:text-foreground transition-colors">Forgot Password?</span>
        </div>
      )}
      {mode === 'signup' && (
        <div className="flex items-center gap-2 my-3 mb-5">
          <input type="checkbox" id="terms" className="w-4 h-4 cursor-pointer" />
          <label htmlFor="terms" className="text-[11px] text-muted-foreground cursor-pointer">
            I agree to the <span className="text-[var(--green)]">Terms of Service</span>
          </label>
        </div>
      )}

      <Button
        onClick={mode === 'login' ? handleLogin : handleSignup}
        disabled={loading}
        className="w-full font-mono text-[13px] gap-1.5"
      >
        {loading ? 'Please wait…' : mode === 'login' ? <>Secure Login <span>→</span></> : <>Create Account <span>→</span></>}
      </Button>

      {/* Footer */}
      <div className="flex items-center justify-between mt-6 pt-5 border-t border-border text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <svg width="10" height="10" viewBox="0 0 16 16" fill="none"><path d="M8 1.5l5.5 2.2v3.6c0 3.4-2.3 6.2-5.5 7.2-3.2-1-5.5-3.8-5.5-7.2V3.7L8 1.5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/></svg>
          Encrypted
        </span>
        <span className="flex items-center gap-2.5">
          <span className="text-muted-foreground cursor-pointer hover:text-foreground transition-colors">Privacy Policy</span>
          <span className="text-border">·</span>
          <span className="text-[var(--green)] cursor-pointer font-medium">Contact Sales</span>
        </span>
      </div>
    </div>
  );
}
