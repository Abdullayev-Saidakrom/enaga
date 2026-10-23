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

const PRICE_OPTIONS = [
  { value: '', label: 'Har qanday narx' },
  { value: '30000', label: '30 000 gacha' },
  { value: '50000', label: '50 000 gacha' },
  { value: '80000', label: '80 000 gacha' },
  { value: '120000', label: '120 000 gacha' },
];

const RATING_OPTIONS = [
  { value: '', label: 'Har qanday reyting' },
  { value: '3', label: '3.0 va yuqori' },
  { value: '4', label: '4.0 va yuqori' },
  { value: '4.5', label: '4.5 va yuqori' },
];

export default function HomePage() {
  const [session, setSession] = useState(undefined);
  const [nannies, setNannies] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [loadingNannies, setLoadingNannies] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [districtFilter, setDistrictFilter] = useState('');
  const [priceFilter, setPriceFilter] = useState('');
  const [ratingFilter, setRatingFilter] = useState('');

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
          district_id,
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
    async function loadDistricts() {
      const { data } = await supabase
        .from('districts')
        .select('id, name')
        .order('name');
      setDistricts(data || []);
    }
    loadNannies();
    loadDistricts();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  function clearFilters() {
    setDistrictFilter('');
    setPriceFilter('');
    setRatingFilter('');
  }

  const hasFilter = districtFilter || priceFilter || ratingFilter;

  const filtered = nannies.filter((n) => {
    if (districtFilter && n.district_id !== districtFilter) return false;
    if (priceFilter && Number(n.hourly_rate) > Number(priceFilter)) return false;
    if (ratingFilter && Number(n.rating || 0) < Number(ratingFilter)) return false;
    return true;
  });

  const selectClass =
    'w-full border border-border rounded-md px-3 py-2 text-xs bg-surface outline-none';

  return (
    <main className="pb-10">
      <div className="flex items-center justify-between px-6 pt-8 pb-4">
        <div className="font-display italic text-primaryDark text-xl">Enaga</div>
        {session === undefined ? null : session ? (
          <div className="flex items-center gap-3">
            <Link href="/bookings" className="text-xs font-bold text-primary">
              Buyurtmalar
            </Link>
            <Link href="/profile" className="text-xs font-bold text-primary">
              Profilim
            </Link>
            <button onClick={handleLogout} className="text-xs font-bold text-inkSoft">
              Chiqish
            </button>
          </div>
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

      <div className="px-6 mb-4">
        <div className="flex flex-col gap-2">
          <select
            value={districtFilter}
            onChange={(e) => setDistrictFilter(e.target.value)}
            className={selectClass}
          >
            <option value="">Barcha tumanlar</option>
            {districts.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            <select
              value={priceFilter}
              onChange={(e) => setPriceFilter(e.target.value)}
              className={selectClass}
            >
              {PRICE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <select
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value)}
              className={selectClass}
            >
              {RATING_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          {hasFilter && (
            <button
              onClick={clearFilters}
              className="text-xs font-bold text-primary text-left"
            >
              Filtrni tozalash
            </button>
          )}
        </div>
      </div>

      <div className="px-6 mb-3 flex items-baseline justify-between">
        <h2 className="font-bold text-sm">Enagalar</h2>
        <span className="text-xs text-inkSoft">{filtered.length} ta</span>
      </div>

      <div className="px-6 flex flex-col gap-3">
        {loadingNannies && <p className="text-sm text-inkSoft">Yuklanmoqda...</p>}
        {loadError && (
          <p className="text-sm text-red-600">
            Xatolik: {loadError}. Supabase sozlamalarini tekshiring.
          </p>
        )}
        {!loadingNannies && !loadError && nannies.length === 0 && (
          <p className="text-sm text-inkSoft">
            Hozircha enagalar yo&apos;q. Birinchi enaga sifatida ro&apos;yxatdan o&apos;ting.
          </p>
        )}
        {!loadingNannies && !loadError && nannies.length > 0 && filtered.length === 0 && (
          <p className="text-sm text-inkSoft">
            Bu filtrga mos enaga topilmadi. Filtrni o&apos;zgartirib ko&apos;ring.
          </p>
        )}
        {filtered.map((n) => (
          <Link
            key={n.user_id}
            href={`/nanny/${n.user_id}`}
            className="flex gap-3 bg-surface border border-border rounded-lg p-4 active:scale-[0.98] transition-transform"
          >
            <div className="w-14 h-14 shrink-0 rounded-full bg-primary text-white flex items-center justify-center font-display font-semibold">
              {initials(n.users?.full_name)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm">{n.users?.full_name || 'Enaga'}</span>
                <span className="text-xs font-bold text-accent">
                  {Number(n.rating || 0).toFixed(1)} ★
                </span>
              </div>
              <div className="text-xs text-inkSoft mt-1">
                {n.districts?.name || 'Tuman ko\u2019rsatilmagan'}, {n.experience_years} yil tajriba
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="font-extrabold text-sm">
                  {fmt(n.hourly_rate)} <small className="font-semibold text-inkSoft">so&apos;m/soat</small>
                </span>
                <span className="text-xs font-bold text-primary">Ko&apos;rish</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
