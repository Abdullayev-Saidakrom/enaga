'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';

const HOUR_OPTIONS = [1, 2, 3, 5, 8];

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

function todayStr() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

function TopBar() {
  return (
    <div className="flex items-center justify-between mb-6">
      <Link href="/" className="font-display italic text-primaryDark text-xl">
        Enaga
      </Link>
      <Link href="/" className="text-xs font-bold text-primary">
        Orqaga
      </Link>
    </div>
  );
}

export default function NannyPage() {
  const params = useParams();
  const router = useRouter();
  const nannyId = params.id;

  const [session, setSession] = useState(undefined);
  const [isParent, setIsParent] = useState(false);
  const [nanny, setNanny] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [date, setDate] = useState(todayStr());
  const [hours, setHours] = useState(2);
  const [children, setChildren] = useState(1);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function init() {
      const { data: sessionData } = await supabase.auth.getSession();
      const s = sessionData.session;
      setSession(s);

      if (s) {
        const { data: parentRow } = await supabase
          .from('parent_profiles')
          .select('user_id')
          .eq('user_id', s.user.id)
          .maybeSingle();
        setIsParent(!!parentRow);
      }

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
          users ( full_name ),
          districts ( name ),
          nanny_services ( services ( name ) )
        `
        )
        .eq('user_id', nannyId)
        .maybeSingle();

      if (error || !data) {
        setLoadError('Enaga topilmadi');
      } else {
        setNanny(data);
      }
      setLoading(false);
    }
    init();
  }, [nannyId]);

  async function handleBook(e) {
    e.preventDefault();
    setMessage('');

    if (date < todayStr()) {
      setMessage("O'tgan sanani tanlab bo'lmaydi");
      return;
    }

    setSaving(true);
    const rate = Number(nanny.hourly_rate) || 0;
    const total = Math.round((rate * hours * (1 + 0.15 * (children - 1))) / 1000) * 1000;

    const { error } = await supabase.from('bookings').insert({
      parent_id: session.user.id,
      nanny_id: nanny.user_id,
      booking_date: date,
      hours,
      children_count: children,
      total_price: total,
    });

    setSaving(false);

    if (error) {
      setMessage('Xatolik: ' + error.message);
      return;
    }
    router.push('/bookings');
  }

  if (loading) {
    return (
      <main className="px-6 py-10">
        <p className="text-sm text-inkSoft">Yuklanmoqda...</p>
      </main>
    );
  }

  if (loadError || !nanny) {
    return (
      <main className="px-6 py-10">
        <TopBar />
        <p className="text-sm text-red-600">{loadError || 'Enaga topilmadi'}</p>
      </main>
    );
  }

  const rate = Number(nanny.hourly_rate) || 0;
  const base = rate * hours;
  const total = Math.round((base * (1 + 0.15 * (children - 1))) / 1000) * 1000;
  const extra = total - base;
  const serviceNames = (nanny.nanny_services || [])
    .map((r) => r.services?.name)
    .filter(Boolean);

  return (
    <main className="px-6 py-10 pb-16">
      <TopBar />

      <div className="flex items-center gap-4 mb-5">
        <div className="w-16 h-16 shrink-0 rounded-full bg-primary text-white flex items-center justify-center font-display font-semibold text-xl">
          {initials(nanny.users?.full_name)}
        </div>
        <div>
          <h1 className="font-display text-xl">{nanny.users?.full_name || 'Enaga'}</h1>
          <p className="text-xs text-inkSoft mt-1">
            {nanny.districts?.name || "Tuman ko'rsatilmagan"}, {nanny.experience_years} yil tajriba
          </p>
        </div>
      </div>

      <div className="flex gap-3 mb-5">
        <div className="flex-1 bg-surface border border-border rounded-md p-3 text-center">
          <div className="font-bold">{Number(nanny.rating || 0).toFixed(1)}</div>
          <div className="text-xs text-inkSoft">{nanny.reviews_count} sharh</div>
        </div>
        <div className="flex-1 bg-surface border border-border rounded-md p-3 text-center">
          <div className="font-bold">{fmt(rate)}</div>
          <div className="text-xs text-inkSoft">so&apos;m/soat</div>
        </div>
      </div>

      {nanny.bio && (
        <div className="mb-5">
          <h2 className="font-bold text-sm mb-2">Enaga haqida</h2>
          <p className="text-sm text-inkSoft leading-relaxed">{nanny.bio}</p>
        </div>
      )}

      {serviceNames.length > 0 && (
        <div className="mb-6">
          <h2 className="font-bold text-sm mb-2">Xizmatlar</h2>
          <div className="flex flex-wrap gap-2">
            {serviceNames.map((name) => (
              <span
                key={name}
                className="px-3 py-1 rounded-full text-xs font-bold bg-primarySoft text-primaryDark"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="border-t border-border pt-6">
        <h2 className="font-display text-lg mb-4">Band qilish</h2>

        {session === null && (
          <div className="p-4 rounded-md bg-accentSoft text-sm">
            Band qilish uchun{' '}
            <Link href="/login" className="font-bold text-primaryDark underline">
              kiring
            </Link>{' '}
            yoki{' '}
            <Link href="/signup" className="font-bold text-primaryDark underline">
              ro&apos;yxatdan o&apos;ting
            </Link>
            .
          </div>
        )}

        {session && !isParent && (
          <div className="p-4 rounded-md bg-accentSoft text-sm">
            Band qilish uchun ota-ona akkaunti kerak. Siz enaga sifatida ro&apos;yxatdan o&apos;tgansiz.
          </div>
        )}

        {session && isParent && rate <= 0 && (
          <div className="p-4 rounded-md bg-accentSoft text-sm">
            Bu enaga hali narxini belgilamagan.
          </div>
        )}

        {session && isParent && rate > 0 && (
          <form onSubmit={handleBook} className="flex flex-col gap-5">
            <div>
              <label className="text-xs font-bold text-inkSoft mb-1 block">Sana</label>
              <input
                type="date"
                required
                min={todayStr()}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full border border-border rounded-md px-4 py-3 text-sm bg-surface outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-inkSoft mb-2 block">
                Necha soatga kerak
              </label>
              <div className="flex flex-wrap gap-2">
                {HOUR_OPTIONS.map((h) => (
                  <button
                    type="button"
                    key={h}
                    onClick={() => setHours(h)}
                    className={`px-4 py-2 rounded-full text-sm font-bold border ${
                      hours === h
                        ? 'bg-accent text-primaryDark border-accent'
                        : 'bg-surface text-inkSoft border-border'
                    }`}
                  >
                    {h} soat
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-inkSoft mb-2 block">Bolalar soni</label>
              <div className="inline-flex items-center gap-4 bg-surface border border-border rounded-md px-4 py-2">
                <button
                  type="button"
                  onClick={() => setChildren((c) => Math.max(1, c - 1))}
                  className="w-8 h-8 rounded-full bg-primarySoft text-primaryDark font-bold"
                >
                  −
                </button>
                <span className="font-bold w-4 text-center">{children}</span>
                <button
                  type="button"
                  onClick={() => setChildren((c) => Math.min(4, c + 1))}
                  className="w-8 h-8 rounded-full bg-primarySoft text-primaryDark font-bold"
                >
                  +
                </button>
              </div>
            </div>

            <div className="bg-primarySoft rounded-md p-4">
              <div className="flex justify-between text-sm text-primaryDark mb-1">
                <span>{hours} soat</span>
                <span>{fmt(base)} so&apos;m</span>
              </div>
              {children > 1 && (
                <div className="flex justify-between text-sm text-primaryDark mb-1">
                  <span>Qo&apos;shimcha bola ({children - 1})</span>
                  <span>+{fmt(extra)} so&apos;m</span>
                </div>
              )}
              <div className="flex justify-between font-extrabold text-primaryDark pt-2 mt-2 border-t border-primary/20">
                <span>Jami</span>
                <span>{fmt(total)} so&apos;m</span>
              </div>
            </div>

            {message && <p className="text-sm text-red-600 font-bold">{message}</p>}

            <button
              disabled={saving}
              className="bg-primary text-white font-bold text-sm py-3 rounded-md disabled:opacity-60"
            >
              {saving ? 'Yuborilmoqda...' : 'Buyurtmani tasdiqlash'}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
