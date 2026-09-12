import React, { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../supabaseClient';

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  return { session, loading };
}

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { session, loading } = useSession();

  if (loading) return null;

  if (!session) {
    return (
      <div
        className="hero"
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          gap: 20,
        }}
      >
        <div>
          <p className="brand-eyebrow">Personal travel log</p>
          <h1 className="brand-title">
            Travel <em>Vault</em>
          </h1>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            width: '100%',
            marginTop: '20px',
          }}
        >
          <button
            className="btn btn-primary"
            style={{ width: '260px' }}
            onClick={() =>
              supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                  redirectTo: window.location.origin,
                  queryParams: {
                    prompt: 'select_account',
                  },
                },
              })
            }
          >
            Continuar con Google
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
