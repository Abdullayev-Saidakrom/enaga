'use client';

import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabaseClient';

export default function SignupPage() {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('parent');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role,
          phone: phone.trim(),
          address: role === 'parent' ? address.trim() : '',
        },
      },
    });

    setLoading(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <main className="px-6 py-16 text-center">
        <h1 className="font-display text-xl mb-3">Email tasdiqlang</h1>
        <p className="text-inkSoft text-sm leading-relaxed">
          {email} manziliga tasdiqlash xati yubordik. Xatdagi havolani bosib,
          so&apos;ngra tizimga kiring.
        </p>
        <Link
          href="/login"
          className="inline-block mt-6 bg-primary text-white font-bold text-sm px-6 py-3 rounded-md"
        >
          Kirish sahifasiga o&apos;tish
        </Link>
      </main>
    );
  }

  return (
    <main className="px-6 py-10">
      <div className="font-display italic text-primaryDark text-xl mb-8">Enaga</div>
      <h1 className="font-display text-xl mb-1">Ro&apos;yxatdan o&apos;tish</h1>
      <p className="text-inkSoft text-sm mb-6">Bir necha daqiqada tayyor bo&apos;ladi</p>

      <div className="flex gap-2 mb-6">
        <button
          type="button"
          onClick={() => setRole('parent')}
          className={`flex-1 py-3 rounded-md text-sm font-bold border ${
            role === 'parent'
              ? 'bg-primary text-white border-primary'
              : 'bg-surface text-inkSoft border-border'
          }`}
        >
          Ota-onaman
        </button>
        <button
          type="button"
          onClick={() => setRole('nanny')}
          className={`flex-1 py-3 rounded-md text-sm font-bold border ${
            role === 'nanny'
              ? 'bg-primary text-white border-primary'
              : 'bg-surface text-inkSoft border-border'
          }`}
        >
          Enagaman
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="text-xs font-bold text-inkSoft mb-1 block">Ism familiya</label>
          <input
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full border border-border rounded-md px-4 py-3 text-sm bg-surface outline-none"
            placeholder="Masalan: Nilufar Yusupova"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-inkSoft mb-1 block">Telefon raqam</label>
          <input
            required
            type="tel"
            minLength={9}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full border border-border rounded-md px-4 py-3 text-sm bg-surface outline-none"
            placeholder="+998 90 123 45 67"
          />
        </div>
        {role === 'parent' && (
          <div>
            <label className="text-xs font-bold text-inkSoft mb-1 block">Manzil</label>
            <input
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full border border-border rounded-md px-4 py-3 text-sm bg-surface outline-none"
              placeholder="Tuman, ko'cha, uy"
            />
            <p className="text-xs text-inkSoft mt-1">
              Manzil enagaga faqat buyurtmani tasdiqlaganidan keyin ko&apos;rinadi.
            </p>
          </div>
        )}
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
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-border rounded-md px-4 py-3 text-sm bg-surface outline-none"
            placeholder="Kamida 6 ta belgi"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          disabled={loading}
          className="bg-primary text-white font-bold text-sm py-3 rounded-md mt-2 disabled:opacity-60"
        >
          {loading ? 'Yuborilmoqda...' : "Ro'yxatdan o'tish"}
        </button>
      </form>

      <p className="text-center text-sm text-inkSoft mt-6">
        Akkountingiz bormi?{' '}
        <Link href="/login" className="text-primary font-bold">
          Kiring
        </Link>
      </p>
    </main>
  );
}
