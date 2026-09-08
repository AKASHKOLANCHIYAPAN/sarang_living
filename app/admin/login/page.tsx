'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, ShieldCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (authError || !data.user) {
        setError(authError?.message || 'Invalid login credentials.');
        setLoading(false);
        return;
      }

      // Check admin role
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();

      if (profileError || !profile || profile.role?.toLowerCase() !== 'admin') {
        await supabase.auth.signOut();
        setError('Access denied. This login is for store administrators only.');
        setLoading(false);
        return;
      }

      // Successful admin login
      router.push('/admin');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">
        <div className="admin-login-brand">
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
            <Sparkles size={28} style={{ color: '#C4888A' }} />
          </div>
          <h1>Sarang Living</h1>
          <p>Store Management Portal</p>
        </div>

        {error && (
          <div className="admin-login-error" style={{ marginBottom: '16px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="admin-login-form">
          <div className="admin-login-field">
            <label htmlFor="admin-email">Email Address</label>
            <input
              id="admin-email"
              type="email"
              required
              placeholder="admin@sarangliving.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <div className="admin-login-field">
            <label htmlFor="admin-password">Password</label>
            <input
              id="admin-password"
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="admin-login-submit"
          >
            {loading ? 'Verifying...' : 'Sign In to Dashboard'}
          </button>
        </form>

        <div className="admin-login-back">
          <a href="/">← Back to Sarang Living Store</a>
        </div>

        <div style={{ marginTop: '24px', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
          <ShieldCheck size={14} style={{ color: '#E85D75' }} />
          <span style={{ fontSize: '11px', color: '#9198A1' }}>
            Sarang Living Management Portal
          </span>
        </div>
      </div>
    </div>
  );
}
