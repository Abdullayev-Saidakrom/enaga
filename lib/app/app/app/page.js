'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../lib/supabaseClient';

function fmt(n) {
  return Math.round(n || 0)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

function initials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('');
}

export default function HomePage() {
  const [session, setSession] = useState(undefined); // undefined = loading, null = logged out
  const [nannies, setNannies] = useState([]);
  const [loadingNannies, setLoadingNannies] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    async function loadNannies() {
      setLoadingNannies(true);
      const { data, error } = await supabase
        .from('nanny_profiles')
        .select(
          `
          user_id,
          bio,
          experience_years,
          hourly_rate,
          rating,
          reviews_count,
          verified,
          users ( full_name ),
          districts ( name )
        `
        )
        .order('rating', { ascending: false });

      if (error) {
        setLoadError(error.message);
      } else {
        setNannies(data || []);
      }
      setLoadingNannies(false);
    }
    loadNannies();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  return (
    <main className="pb-10">
      <div className="flex items-center justify-between px-6 pt-8 pb-4">
        <div className="font-display italic text-primaryDark text-xl">Enaga</div>
        {session === undefined ? null : session ? (
          <button onClick={handleLogout} className="text-xs font-bold text-inkSoft">
            Chiqish
          </button>
        ) : (
          <Link href="/login" className="text-xs font-bold text-primary">
            Kirish
          </Link>
        )}
      </div>

      <div className="mx-6 mb-6 p-5 rounded-lg bg-primary text-white">
        <h1 className="font-display text-lg mb-2 max-w-[220px]">
          Farzandingiz uchun ishonchli enaga toping
        </h1>
        <p className="text-sm text-primarySoft max-w-[240px]">
          Reytingi va sharhlari tasdiqlangan yordamchilar shahar bo&apos;yicha.
        </p>
      </div>

      {session === null && (
        <div className="mx-6 mb-6 p-4 rounded-md bg-accentSoft text-sm">
          Buyurtma berish uchun{' '}
          <Link href="/signup" className="font-bold text-primaryDark underline">
            ro&apos;yxatdan o&apos;ting
          </Link>
          .
        </div>
      )}

      <div className="px-6 mb-3 flex items-baseline justify-between">
        <h2 className="font-bold text-sm">Enagalar</h2>
        <span className="text-xs text-inkSoft">{nannies.length} ta</span>
      </div>

      <div className="px-6 flex flex-col gap-3">
        {loadingNannies && <p className="text-sm text-inkSoft">Yuklanmoqda...</p>}
        {loadError && (
          <p className="text-sm text-red-600">
            Xatolik: {loadError}. Supabase sozlamalarini tekshiring.
          </p>
        )}
        {!loadingNannies && !loadError && nannies.length === 0 && (
          <p
