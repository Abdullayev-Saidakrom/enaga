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

async function fetchContact(bookingId) {
  const { data } = await supabase.rpc('get_parent_contact', {
    p_booking_id: bookingId,
  });
  return data && data.length > 0 ? data[0] : null;
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

function ReviewForm({ bookingId, onDone }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  async function submit() {
    if (rating < 1) {
      setErr('Iltimos, yulduzcha tanlang.');
      return;
    }
    setSaving(true);
    setErr('');
    const { error } = await supabase.from('reviews').insert({
      booking_id: bookingId,
      rating,
      comment: comment.trim() || null,
    });
    if (error) {
      setErr(error.message);
      setSaving(false);
      return;
    }
    onDone(bookingId, rating, comment.trim());
  }

  return (
    <div className="mt-4 pt-4 border-t border-border">
      <div className="text-xs font-bold mb-2">Enagani baholang</div>
      <div className="flex gap-1 mb-3">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            className={`text-2xl leading-none ${
              n <= rating ? 'text-accent' : 'text-border'
            }`}
            aria-label={`${n} yulduz`}
          >
            ★
          </button>
        ))}
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={3}
        placeholder="Sharh yozing (ixtiyoriy)"
        className="w-full border border-border rounded-lg p-3 text-sm bg-white"
      />
      {err && <p className="text-xs text-red-600 mt-2">{err}</p>}
      <button
        onClick={submit}
        disabled={saving}
        className="w-full mt-3 bg-primary text-white text-xs font-bold py-2 rounded-full disabled:opacity-50"
      >
        {saving ? 'Yuborilmoqda...' : 'Sharhni yuborish'}
      </button>
    </div>
  );
}

export default function BookingsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState([]);
  const [reviews, setReviews] = useState({});
  const [contacts, setContacts] = useState({});
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

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
        setLoading(false);
        return;
      }

      const list = data || [];
      setBookings(list);

      const ids = list.map((b) => b.id);
      if (ids.length > 0) {
        const { data: revData } = await supabase
          .from('reviews')
          .select('booking_id, rating, comment')
          .in('booking_id', ids);
        const map = {};
        (revData || []).forEach((r) => {
          map[r.booking_id] = r;
        });
        setReviews(map);
      }

      const eligible = list.filter(
        (b) =>
          b.nanny_id === s.user.id &&
          (b.status === 'confirmed' || b.status === 'completed')
      );
      if (eligible.length > 0) {
        const results = await Promise.all(
          eligible.map(async (b) => [b.id, await fetchContact(b.id)])
        );
        const cmap = {};
        results.forEach(([id, c]) => {
          if (c) cmap[id] = c;
        });
        setContacts(cmap);
      }

      setLoading(false);
    }
    init();
  }, [router]);

  async function changeStatus(id, newStatus) {
    setBusyId(id);
    setError('');

    const { data, error: updError } = await supabase
      .from('bookings')
      .update({ status: newStatus })
      .eq('id', id)
      .select('id, status');

    if (updError) {
      setError(updError.message);
    } else if (!data || data.length === 0) {
      setError("Statusni o'zgartirib bo'lmadi (ruxsat yo'q).");
    } else {
      setBookings((prev) =>
        prev.map((b) => (b.id === id ? { ...b, status: newStatus } : b))
      );
      if (newStatus === 'confirmed') {
        const c = await fetchContact(id);
        if (c) setContacts((prev) => ({ ...prev, [id]: c }));
      }
    }
    setBusyId(null);
  }

  function handleReviewDone(bookingId, rating, comment) {
    setReviews((prev) => ({
      ...prev,
      [bookingId]: { booking_id: bookingId, rating, comment },
    }));
  }

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
          const isNanny = b.nanny_id === userId;
          const busy = busyId === b.id;
          const review = reviews[b.id];
          const contact = contacts[b.id];
          return (
            <div key={b.id} className="bg-surface border border-border rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="font-bold text-sm">
                    {isMine
                      ? b.nanny_profiles?.users?.full_name || 'Enaga'
                      : contact?.full_name || 'Yangi buyurtma'}
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

              {isNanny && contact && (
                <div className="mt-4 pt-4 border-t border-border text-xs">
                  <div className="font-bold mb-2">Ota-ona ma&apos;lumoti</div>
                  <div className="text-inkSoft leading-relaxed">
                    <div>Ism: {contact.full_name || "ko'rsatilmagan"}</div>
                    <div>Telefon: {contact.phone || "ko'rsatilmagan"}</div>
                    <div>Email: {contact.email || "ko'rsatilmagan"}</div>
                    <div>Manzil: {contact.address || "ko'rsatilmagan"}</div>
                  </div>
                </div>
              )}

              {isNanny && b.status === 'pending' && (
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => changeStatus(b.id, 'confirmed')}
                    disabled={busy}
                    className="flex-1 bg-primary text-white text-xs font-bold py-2 rounded-full disabled:opacity-50"
                  >
                    Tasdiqlash
                  </button>
                  <button
                    onClick={() => changeStatus(b.id, 'cancelled')}
                    disabled={busy}
                    className="flex-1 border border-border text-xs font-bold py-2 rounded-full disabled:opacity-50"
                  >
                    Rad etish
                  </button>
                </div>
              )}

              {isNanny && b.status === 'confirmed' && (
                <div className="mt-4">
                  <button
                    onClick={() => changeStatus(b.id, 'completed')}
                    disabled={busy}
                    className="w-full bg-primary text-white text-xs font-bold py-2 rounded-full disabled:opacity-50"
                  >
                    Yakunlandi deb belgilash
                  </button>
                </div>
              )}

              {b.status === 'completed' && review && (
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="text-accent text-lg leading-none">
                    {'★'.repeat(review.rating)}
                    <span className="text-border">{'★'.repeat(5 - review.rating)}</span>
                  </div>
                  {review.comment && (
                    <p className="text-xs text-inkSoft mt-2">{review.comment}</p>
                  )}
                </div>
              )}

              {isMine && b.status === 'completed' && !review && (
                <ReviewForm bookingId={b.id} onDone={handleReviewDone} />
              )}
            </div>
          );
        })}
      </div>
    </main>
  );
}
