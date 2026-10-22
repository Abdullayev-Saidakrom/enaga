'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';

function TopBar() {
  return (
    <div className="flex items-center justify-between mb-8">
      <Link href="/" className="font-display italic text-primaryDark text-xl">
        Enaga
      </Link>
      <Link href="/" className="text-xs font-bold text-primary">
        Bosh sahifa
      </Link>
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const [session, setSession] = useState(undefined);
  const [districts, setDistricts] = useState([]);
  const [services, setServices] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);
  const [districtId, setDistrictId] = useState('');
  const [experienceYears, setExperienceYears] = useState(0);
  const [hourlyRate, setHourlyRate] = useState(0);
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [notNanny, setNotNanny] = useState(false);

  useEffect(() => {
    async function init() {
      const { data: sessionData } = await supabase.auth.getSession();
      const s = sessionData.session;
      setSession(s);

      if (!s) {
        router.push('/login');
        return;
      }

      const [{ data: districtsData }, { data: servicesData }] = await Promise.all([
        supabase.from('districts').select('id, name').order('name'),
        supabase.from('services').select('id, name').order('name'),
      ]);
      setDistricts(districtsData || []);
      setServices(servicesData || []);

      const { data: profile, error: profileError } = await supabase
        .from('nanny_profiles')
        .select('district_id, experience_years, hourly_rate, bio, nanny_services ( service_id )')
        .eq('user_id', s.user.id)
        .maybeSingle();

      if (profileError || !profile) {
        setNotNanny(true);
        setLoading(false);
        return;
      }

      setDistrictId(profile.district_id || '');
      setExperienceYears(profile.experience_years || 0);
      setHourlyRate(profile.hourly_rate || 0);
      setBio(profile.bio || '');
      setSelectedServices((profile.nanny_services || []).map((r) => r.service_id));
      setLoading(false);
    }
    init();
  }, [router]);

  function toggleService(id) {
    setSelectedServices((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    const userId = session.user.id;

    const { error: updateError } = await supabase
      .from('nanny_profiles')
      .update({
        district_id: districtId || null,
        experience_years: Number(experienceYears),
        hourly_rate: Number(hourlyRate),
        bio,
      })
      .eq('user_id', userId);

    if (updateError) {
      setMessage('Xatolik: ' + updateError.message);
      setSaving(false);
      return;
    }

    await supabase.from('nanny_services').delete().eq('nanny_id', userId);

    if (selectedServices.length > 0) {
      const rows = selectedServices.map((serviceId) => ({
        nanny_id: userId,
        service_id: serviceId,
      }));
      const { error: insertError } = await supabase.from('nanny_services').insert(rows);
      if (insertError) {
        setMessage('Xatolik: ' + insertError.message);
        setSaving(false);
        return;
      }
    }

    setSaving(false);
    setMessage('Saqlandi!');
  }

  if (loading) {
    return (
      <main className="px-6 py-10">
        <p className="text-sm text-inkSoft">Yuklanmoqda...</p>
      </main>
    );
  }

  if (notNanny) {
    return (
      <main className="px-6 py-10">
        <TopBar />
        <p className="text-sm text-inkSoft">
          Bu sahifa faqat enaga sifatida ro&apos;yxatdan o&apos;tganlar uchun.
        </p>
      </main>
    );
  }

  return (
    <main className="px-6 py-10 pb-16">
      <TopBar />
      <h1 className="font-display text-xl mb-1">Profilingizni to&apos;ldiring</h1>
      <p className="text-inkSoft text-sm mb-6">
        Bu ma&apos;lumotlar ota-onalarga ko&apos;rinadi
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div>
          <label className="text-xs font-bold text-inkSoft mb-1 block">Tuman</label>
          <select
            value={districtId}
            onChange={(e) => setDistrictId(e.target.value)}
            className="w-full border border-border rounded-md px-4 py-3 text-sm bg-surface outline-none"
          >
            <option value="">Tanlanmagan</option>
            {districts.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-bold text-inkSoft mb-1 block">
            Tajriba (necha yil)
          </label>
          <input
            type="number"
            min="0"
            value={experienceYears}
            onChange={(e) => setExperienceYears(e.target.value)}
            className="w-full border border-border rounded-md px-4 py-3 text-sm bg-surface outline-none"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-inkSoft mb-1 block">
            Narx (so&apos;m / soat)
          </label>
          <input
            type="number"
            min="0"
            step="1000"
            value={hourlyRate}
            onChange={(e) => setHourlyRate(e.target.value)}
            className="w-full border border-border rounded-md px-4 py-3 text-sm bg-surface outline-none"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-inkSoft mb-1 block">O&apos;zingiz haqingizda</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            className="w-full border border-border rounded-md px-4 py-3 text-sm bg-surface outline-none"
            placeholder="Tajribangiz va ishlash uslubingiz haqida qisqacha yozing"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-inkSoft mb-2 block">
            Ko&apos;rsatadigan xizmatlar
          </label>
          <div className="flex flex-wrap gap-2">
            {services.map((s) => (
              <button
                type="button"
                key={s.id}
                onClick={() => toggleService(s.id)}
                className={`px-3 py-2 rounded-full text-xs font-bold border ${
                  selectedServices.includes(s.id)
                    ? 'bg-primary text-white border-primary'
                    : 'bg-surface text-inkSoft border-border'
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>

        {message && <p className="text-sm text-primary font-bold">{message}</p>}

        <button
          disabled={saving}
          className="bg-primary text-white font-bold text-sm py-3 rounded-md mt-2 disabled:opacity-60"
        >
          {saving ? 'Saqlanmoqda...' : 'Saqlash'}
        </button>
      </form>
    </main>
  );
}
