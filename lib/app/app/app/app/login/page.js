'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (signInError) {
      setError(signInError.message);
      return;
    }
    router.push('/');
    router.refresh();
  }

  return (
    <main className="px-6 py-10">
      <div className="font-display italic text-primaryDark text-xl mb-8">Enaga</div>
      <h1 className="font-display text-xl mb-1">Xush kelibsiz</h1>
      <p className="text-inkSoft text-sm mb-6">Hisobingizga kiring</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="text-xs font-bold text-inkSoft mb-1 block">Email</label>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-border rounded-md px-4 py-3 text-sm bg-surface outline-none"
            placeholder="email@misol.com"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-inkSoft mb-1 block">Parol</label>
          <input
            required
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-border rounded-md px-4 py-3 text-sm bg-surface outline-none"
            placeholder="Parolingiz"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          disabled={loading}
          className="bg-primary text-white font-bold text-sm py-3 rounded-md mt-2 disabled:opacity-60"
        >
          {loading ? 'Kirilmoqda...' : 'Kirish'}
        </button>
      </form>

      <p className="text-center text-sm text-inkSoft mt-6">
        Akkountingiz yo'qmi?{' '}
        <Link href="/signup" className="text-primary font-bold">
          Ro'yxatdan o'ting
        </Link>
      </p>
    </main>
  );
}
