import React, { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../supabaseClient';
import { IconSpinner } from '../icons';

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  // When someone opens the "reset password" email link, Supabase creates a
  // temporary session and fires this event — we need to intercept it and
  // ask for the new password instead of letting them straight into the app.
  const [recovery, setRecovery] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      if (event === 'PASSWORD_RECOVERY') setRecovery(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return { session, loading, recovery, clearRecovery: () => setRecovery(false) };
}

const PASSWORD_MIN_LENGTH = 8;
// Must match "Password requirements" in Supabase → Authentication →
// Policies: lowercase, uppercase, digit and symbol — so the user doesn't
// submit the form and only find out about the error from the server.
const PASSWORD_REQUIREMENTS_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/;
const PASSWORD_HINT = `At least ${PASSWORD_MIN_LENGTH} characters, with uppercase, lowercase, numbers and symbols.`;

function validatePassword(password: string): string | null {
  if (password.length < PASSWORD_MIN_LENGTH) return PASSWORD_HINT;
  if (!PASSWORD_REQUIREMENTS_RE.test(password)) return PASSWORD_HINT;
  return null;
}

type Mode = 'signin' | 'signup';

function GoogleButton() {
  return (
    <button
      className="btn btn-primary"
      style={{ width: '100%' }}
      onClick={() =>
        supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: window.location.origin,
            queryParams: { prompt: 'select_account' },
          },
        })
      }
    >
      Continue with Google
    </button>
  );
}

function ForgotPasswordForm({ onBack }: { onBack: () => void }) {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
      });
      if (error) throw error;
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  if (sent) {
    return (
      <p className="auth-toggle" style={{ marginTop: 0 }}>
        If <strong>{email}</strong> has an account, we've sent a link to pick a new password.
      </p>
    );
  }

  return (
    <form onSubmit={submit}>
      {error && <p className="auth-error">{error}</p>}
      <div className="field">
        <label htmlFor="auth-forgot-email">Email</label>
        <input
          id="auth-forgot-email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
      </div>
      <button className="btn btn-primary" style={{ width: '100%' }} type="submit" disabled={busy}>
        {busy ? 'One moment…' : 'Send reset link'}
      </button>
      <p className="auth-toggle">
        <button type="button" onClick={onBack}>Back to sign in</button>
      </p>
    </form>
  );
}

function EmailPasswordForm({ mode }: { mode: Mode }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmSent, setConfirmSent] = useState(false);
  const [forgot, setForgot] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (mode === 'signup') {
      const problem = validatePassword(password);
      if (problem) { setError(problem); return; }
    }
    setBusy(true);
    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        // If the Supabase project requires email confirmation, signUp
        // won't return a session yet — tell the user instead of leaving
        // the form looking like nothing happened.
        if (data.user && !data.session) setConfirmSent(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  if (forgot) return <ForgotPasswordForm onBack={() => setForgot(false)} />;

  if (confirmSent) {
    return (
      <p className="auth-toggle" style={{ marginTop: 0 }}>
        We've sent a confirmation link to <strong>{email}</strong>. Open it to activate your account.
      </p>
    );
  }

  return (
    <form onSubmit={submit}>
      {error && <p className="auth-error">{error}</p>}
      <div className="field">
        <label htmlFor="auth-email">Email</label>
        <input
          id="auth-email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
      </div>
      <div className="field">
        <label htmlFor="auth-password">Password</label>
        <input
          id="auth-password"
          type="password"
          required
          minLength={mode === 'signup' ? PASSWORD_MIN_LENGTH : undefined}
          autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        {mode === 'signup' && <p className="hint">{PASSWORD_HINT}</p>}
        {mode === 'signin' && (
          <p className="hint">
            <button type="button" onClick={() => setForgot(true)}>Forgot your password?</button>
          </p>
        )}
      </div>
      <button className="btn btn-primary" style={{ width: '100%' }} type="submit" disabled={busy}>
        {busy ? 'One moment…' : mode === 'signin' ? 'Sign in' : 'Create account'}
      </button>
    </form>
  );
}

function ResetPasswordScreen({ onDone }: { onDone: () => void }) {
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const problem = validatePassword(password);
    if (problem) { setError(problem); return; }
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="hero"
      style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center', textAlign: 'center', gap: 20,
      }}
    >
      <div>
        <p className="brand-eyebrow">Personal travel log</p>
        <h1 className="brand-title">Choose a <em>new password</em></h1>
      </div>
      <div className="auth-card">
        <form onSubmit={submit}>
          {error && <p className="auth-error">{error}</p>}
          <div className="field">
            <label htmlFor="auth-new-password">New password</label>
            <input
              id="auth-new-password"
              type="password"
              required
              minLength={PASSWORD_MIN_LENGTH}
              autoComplete="new-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
            <p className="hint">{PASSWORD_HINT}</p>
          </div>
          <button className="btn btn-primary" style={{ width: '100%' }} type="submit" disabled={busy}>
            {busy ? 'One moment…' : 'Save password'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { session, loading, recovery, clearRecovery } = useSession();
  const [mode, setMode] = useState<Mode>('signin');

  if (loading) {
    return (
      <div
        className="hero"
        style={{
          minHeight: '100vh', display: 'flex', flexDirection: 'column',
          justifyContent: 'center', alignItems: 'center', gap: 12,
        }}
      >
        <IconSpinner size={28} />
      </div>
    );
  }

  if (session && recovery) {
    return <ResetPasswordScreen onDone={clearRecovery} />;
  }

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

        <div className="auth-card">
          <GoogleButton />
          <div className="auth-divider">or with email</div>
          <EmailPasswordForm key={mode} mode={mode} />
          <p className="auth-toggle">
            {mode === 'signin' ? (
              <>Don't have an account? <button type="button" onClick={() => setMode('signup')}>Sign up</button></>
            ) : (
              <>Already have an account? <button type="button" onClick={() => setMode('signin')}>Sign in</button></>
            )}
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
