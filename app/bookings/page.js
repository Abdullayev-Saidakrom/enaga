'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';

const STATUS_LABELS = {
  pending: 'Kutilmoqda',
  confirmed: 'Tasdiqlandi',
  completed: 'Yakunlandi',
  cancelled: 'Bekor qilindi',
};

function fmt(n) {
  return Math.round(n || 0)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

function TopBar() {
  return (
    <div className="flex items-center justify-between mb-6">
      <Link href="/" className="font-display italic text-primaryDark text-xl">
        Enaga
      </Link>
      <Link href="/" className="text-xs font-bold text-primary">
        Bosh sahifa
      </Link>
    </div>
  );
}

export default function BookingsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState([]);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function init() {
      const { data: sessionData } = await supabase.auth.getSession();
      const s = sessionData.session;

      if (!s) {
        router.push('/login');
        return;
      }
      setUserId(s.user.id);

      const { data, error: loadError } = await supabase
        .from('bookings')
        .select(
          `
          id,
          booking_date,
          hours,
          children_count,
          total_price,
          status,
          parent_id,
          nanny_id,
          nanny_profiles ( users ( full_name ) )
        `
        )
        .order('created_at', { ascending: false });

      if (loadError) {
        setError(loadError.message);
      } else {
        setBookings(data || []);
      }
      setLoading(false);
    }
    init();
  }, [router]);

  if (loading) {
    return (
      <main className="px-6 py-10">
        <p className="text-sm text-inkSoft">Yuklanmoqda...</p>
      </main>
    );
  }

  return (
    <main className="px-6 py-10 pb-16">
      <TopBar />
      <div className="flex items-baseline justify-between mb-4">
        <h1 className="font-display text-xl">Buyurtmalarim</h1>
        <span className="text-xs text-inkSoft">{bookings.length} ta</span>
      </div>

      {error && <p className="text-sm text-red-600 mb-4">Xatolik: {error}</p>}

      {!error && bookings.length === 0 && (
        <p className="text-sm text-inkSoft">
          Hozircha buyurtmalar yo&apos;q. Bosh sahifada enaga tanlab, birinchi buyurtmangizni bering.
        </p>
      )}

      <div className="flex flex-col gap-3">
        {bookings.map((b) => {
          const isMine = b.parent_id === userId;
          return (
            <div key={b.id} className="bg-surface border border-border rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="font-bold text-sm">
                    {isMine
                      ? b.nanny_profiles?.users?.full_name || 'Enaga'
                      : 'Yangi buyurtma'}
                  </div>
                  <div className="text-xs text-inkSoft mt-1">
                    {b.booking_date}, {b.hours} soat
                  </div>
                </div>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-accentSoft text-primaryDark">
                  {STATUS_LABELS[b.status] || b.status}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-inkSoft">{b.children_count} ta bola</span>
                <span className="font-extrabold text-sm">
                  {fmt(b.total_price)} <small className="font-semibold text-inkSoft">so&apos;m</small>
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
