import { useState } from 'react';
import { ShieldCheck, Eye, EyeOff, Loader2 } from 'lucide-react';
import { projectId, publicAnonKey } from '/utils/supabase/info';
import { supabase } from '../supabaseClient';

const SERVER = `https://${projectId}.supabase.co/functions/v1/make-server-1ee6cbef`;

type Mode = 'login' | 'signup';

interface Props {
  onAuth: (session: { accessToken: string; email: string; name: string }) => void;
}

export function LoginScreen({ onAuth }: Props) {
  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'signup') {
        const res = await fetch(`${SERVER}/signup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${publicAnonKey}` },
          body: JSON.stringify({ email, password, name }),
        });
        const data = await res.json();
        if (!res.ok) { setError(data.error || 'Sign up failed'); setLoading(false); return; }
      }

      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError || !data.session) {
        setError(signInError?.message || 'Invalid credentials');
        setLoading(false);
        return;
      }

      const user = data.session.user;
      onAuth({
        accessToken: data.session.access_token,
        email: user.email ?? email,
        name: (user.user_metadata?.name as string) || user.email || email,
      });
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-[#0058AB] mb-3">
            <ShieldCheck className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Accessibility Auditor</h1>
          <p className="text-sm text-gray-500 mt-1">Capgemini Digital Accessibility</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-5">
            {mode === 'login' ? 'Sign in to your account' : 'Create auditor account'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Full name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Jane Smith"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0058AB]/30 focus:border-[#0058AB]"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@capgemini.com"
                required
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0058AB]/30 focus:border-[#0058AB]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 pr-9 text-sm focus:outline-none focus:ring-2 focus:ring-[#0058AB]/30 focus:border-[#0058AB]"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-[#0058AB] hover:bg-[#004a91] text-white text-sm font-medium rounded-lg py-2.5 transition-colors disabled:opacity-60"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {mode === 'login' ? 'Sign in' : 'Create account'}
            </button>
          </form>

          <div className="mt-4 pt-4 border-t border-gray-100 text-center">
            <span className="text-xs text-gray-500">
              {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            </span>
            <button
              onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); }}
              className="text-xs font-medium text-[#0058AB] hover:underline"
            >
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">WCAG 2.2 Level A &amp; AA</p>
      </div>
    </div>
  );
}
