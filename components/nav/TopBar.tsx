import { signOut } from '@/auth';

export default function TopBar({ userName, initials }: { userName: string; initials: string }) {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 56,
        zIndex: 40,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 32px 0 96px',
        background: 'rgba(244,244,245,.82)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid #e9e9eb',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontFamily: 'var(--font-space)', fontWeight: 700, fontSize: 16, letterSpacing: '-.01em' }}>
          CoreMatch
        </span>
        <span
          style={{
            fontSize: 10,
            letterSpacing: '.18em',
            color: '#10b981',
            border: '1px solid #a7f3d0',
            background: '#ecfdf5',
            padding: '2px 7px',
            borderRadius: 6,
          }}
        >
          v2 · TALENT INTELLIGENCE
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 18, fontSize: 12, color: '#71717a' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 0 3px #d1fae5' }} />
          Engine live
        </span>
        <span style={{ fontSize: 12, color: '#52525b' }}>{userName}</span>
        <form
          action={async () => {
            'use server';
            await signOut({ redirectTo: '/login' });
          }}
        >
          <button
            type="submit"
            title="Sign out"
            style={{
              width: 30,
              height: 30,
              borderRadius: '50%',
              background: '#18181b',
              color: '#fff',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {initials}
          </button>
        </form>
      </div>
    </div>
  );
}
