// ==========================================
// AirOps AI — AuthWall Component
// Handles Clerk protection and local fallback
// ==========================================

import { ClerkProvider, SignedIn, SignedOut, SignIn, useUser } from '@clerk/clerk-react';
import { ShieldAlert, KeyRound } from 'lucide-react';
import React from 'react';

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

export default function AuthWall({ children }: { children: React.ReactNode }) {
  // If no key is provided, show a bypass message but allow the app to render in "Mock Mode"
  // to avoid crashing the pitch if the user hasn't plugged keys yet.
  if (!PUBLISHABLE_KEY) {
    return (
      <>
        <div style={{ background: '#f59e0b', color: '#fff', padding: '8px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 13, zIndex: 9999, position: 'relative' }}>
          <KeyRound size={16} />
          <strong>Mock Mode:</strong> VITE_CLERK_PUBLISHABLE_KEY não encontrada no .env. Autenticação RBAC e Tenant Isolation inativos. Insira a chave para ativar.
        </div>
        {children}
      </>
    );
  }

  return (
    <ClerkProvider publishableKey={PUBLISHABLE_KEY} localization={{
      signIn: { start: { title: "Acesso SAC - AirOps AI", subtitle: "Identifique seu nível de autorização (Atendimento, Supervisor, etc)" } }
    }}>
      <SignedIn>
        {children}
      </SignedIn>
      <SignedOut>
        <div style={{ display: 'flex', alignItems: 'center', justifyItems: 'center', height: '100vh', width: '100vw', background: 'var(--bg-main)', position: 'relative' }}>
           <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundImage: 'url("https://www.turing.com/blog/wp-content/uploads/2022/10/How-do-the-Aviation-Industry-Benefits-from-Big-Data-in-Different-Aspects_.jpg")', backgroundSize: 'cover', opacity: 0.1, zIndex: 0 }} />
           <div style={{ margin: 'auto', zIndex: 1, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', borderRadius: 16 }}>
             <SignIn routing="hash" />
           </div>
        </div>
      </SignedOut>
    </ClerkProvider>
  );
}

export function RoleBadge() {
  // If we are in Mock mode without a Key, don't attempt to use Clerk hooks at all
  if (!PUBLISHABLE_KEY) {
    return <div style={{ background: 'var(--bg-main)', padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>MOCK ADMIN</div>;
  }

  return <ActualRoleBadge />;
}

function ActualRoleBadge() {
  const { user } = useUser();
  if (!user) return <div style={{ background: 'var(--bg-main)', padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>GUEST</div>;

  const role = user.publicMetadata?.role as string || 'Atendimento I';
  return (
    <div style={{ background: role === 'Supervisor' ? '#dbeafe' : 'var(--bg-main)', color: role === 'Supervisor' ? '#1e40af' : 'var(--text-primary)', padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600 }}>
      {role.toUpperCase()}
    </div>
  );
}
