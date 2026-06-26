import AuthCard from '@/components/auth/AuthCard';

export default function LoginPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        fontFamily: 'var(--font-mono), ui-monospace, monospace',
      }}
    >
      <AuthCard />
    </div>
  );
}
