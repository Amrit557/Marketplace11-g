'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Check } from 'lucide-react';
import { marketplaceApi } from '@/lib/marketplace-api';
import { DEMO_MODE } from '@/lib/demo-mode';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error: signInError } = await marketplaceApi.auth.signInWithPassword({ email, password });
    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }
    router.push('/dashboard');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f5f7f4] px-5">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-8 flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded bg-[#c8ff00] font-mono text-xl font-black shadow-[3px_3px_0_#101513]">K</span>
          <span className="font-mono text-sm font-black tracking-[-0.04em]">KRAFTO</span>
        </Link>
        <div className="rounded-lg border-2 border-[#101513] bg-white p-7 shadow-[6px_6px_0_#101513]">
          <h1 className="font-mono text-3xl font-black tracking-tight">Welcome back.</h1>
          <p className="mt-2 text-sm text-[#68746c]">Sign in to continue to your workspace.</p>
          {error && <div className="mt-4 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <label className="block">
              <span className="text-xs font-bold">Email</span>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="form-field mt-2" placeholder="you@example.com" />
            </label>
            <label className="block">
              <span className="text-xs font-bold">Password</span>
              <input type="password" required minLength={10} value={password} onChange={(e) => setPassword(e.target.value)} className="form-field mt-2" placeholder="At least 10 characters" />
            </label>
            <button type="submit" disabled={loading} className="primary-btn w-full justify-center disabled:opacity-50">
              {loading ? 'Signing in...' : 'Sign in'} <ArrowRight size={16} />
            </button>
          </form>
          {DEMO_MODE && (
            <details className="mt-5 rounded border border-[#e3c56f] bg-[#fff9e8] p-3 text-xs">
              <summary className="cursor-pointer font-bold">Demo logins (sample data only)</summary>
              <p className="mt-2 text-[#68746c]">All demo accounts use password <code className="font-bold text-[#101513]">KraftoDemo!2026</code>.</p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {[
                  ['Buyer', 'buyer@krafto-demo.test'],
                  ['Creator', 'creator@krafto-demo.test'],
                  ['Verified business (demo)', 'business@krafto-demo.test'],
                  ['Pending business (demo)', 'pending-business@krafto-demo.test'],
                  ['Admin (demo)', 'admin@krafto-demo.test'],
                ].map(([label, demoEmail]) => (
                  <button
                    key={demoEmail}
                    type="button"
                    onClick={() => { setEmail(demoEmail); setPassword('KraftoDemo!2026'); }}
                    className="rounded border border-[#101513]/15 bg-white p-2 text-left font-bold hover:border-[#101513]"
                  >
                    {label}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-[10px] leading-4 text-[#68746c]">Do not enable demo mode or seed these accounts on a production system.</p>
            </details>
          )}
          <p className="mt-5 text-center text-sm text-[#68746c]">
            New here? <Link href="/register" className="font-bold text-[#101513] underline">Create an account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
