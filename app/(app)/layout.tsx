import { auth, signOut } from '@/auth';
import { redirect } from 'next/navigation';
import NavIsland from '@/components/nav/NavIsland';
import TopBar from '@/components/nav/TopBar';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const isAdmin = session.user.role === 'SuperAdmin' || session.user.role === 'TenantAdmin';
  const initials = session.user.name
    ? session.user.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : session.user.email?.slice(0, 2).toUpperCase() ?? 'U';

  const handleSignOut = async () => {
    'use server';
    await signOut({ redirectTo: '/login' });
  };

  return (
    <>
      <TopBar
        userName={session.user.name ?? session.user.email ?? 'User'}
        initials={initials}
        email={session.user.email ?? ''}
        onSignOut={handleSignOut}
      />
      <NavIsland isAdmin={isAdmin} initials={initials} />
      <div style={{ paddingTop: 52, paddingLeft: 76 }}>{children}</div>
    </>
  );
}
