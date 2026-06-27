import { signOut } from '@/auth';
import UserMenu from './UserMenu';

export default function TopBar({
  userName,
  initials,
  email,
}: {
  userName: string;
  initials: string;
  email: string;
}) {
  const handleSignOut = async () => {
    'use server';
    await signOut({ redirectTo: '/login' });
  };

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
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 18, fontSize: 12, color: '#71717a' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 0 3px #d1fae5' }} />
          Engine live
        </span>
        <UserMenu
          userName={userName}
          initials={initials}
          email={email}
          onSignOut={handleSignOut}
        />
      </div>
    </div>
  );
}
