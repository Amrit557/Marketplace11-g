'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, CheckCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { marketplaceApi } from '@/lib/marketplace-api';

export default function SettingsPage() {
  const router = useRouter();
  const { user, profile, loading, refreshProfile } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [skills, setSkills] = useState('');
  const [languages, setLanguages] = useState('');
  const [website, setWebsite] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => { if (!loading && !user) router.push('/login'); }, [user, loading, router]);
  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '');
      setBio(profile.bio || '');
      setLocation(profile.location || '');
      setSkills(profile.skills?.join(', ') || '');
      setLanguages(profile.languages?.join(', ') || '');
      setWebsite(profile.website || '');
    }
  }, [profile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const { error } = await marketplaceApi.from('profiles').update({
      display_name: displayName,
      bio,
      location,
      skills: skills.split(',').map((s) => s.trim()).filter(Boolean),
      languages: languages.split(',').map((s) => s.trim()).filter(Boolean),
      website,
      updated_at: new Date().toISOString(),
    }).eq('id', user.id);
    if (error) { setNotice('Error: ' + error.message); return; }
    await refreshProfile();
    setNotice('Profile saved successfully.');
    window.setTimeout(() => setNotice(''), 3000);
  };

  if (loading || !profile) return <div className="grid min-h-screen place-items-center bg-[#f5f7f4]"><div className="font-mono text-sm text-[#68746c]">Loading...</div></div>;

  return (
    <main className="min-h-screen bg-[#f5f7f4] text-[#101513]">
      <header className="sticky top-0 z-30 border-b border-[#101513]/10 bg-[#f5f7f4]/95 backdrop-blur-md">
        <div className="mx-auto flex h-[70px] max-w-[1440px] items-center justify-between px-5 lg:px-10">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded bg-[#c8ff00] font-mono text-xl font-black shadow-[3px_3px_0_#101513]">K</span>
            <span className="font-mono text-sm font-black">KRAFTO</span>
          </Link>
          <Link href="/dashboard" className="rounded-md bg-[#101513] px-3 py-2 text-xs font-bold text-white">Back to dashboard</Link>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-5 pb-20 lg:px-10">
        <div className="border-b border-[#101513]/15 py-10">
          <div className="eyebrow"><span className="pulse-dot" /> SETTINGS / PROFILE</div>
          <h1 className="mt-4 font-mono text-4xl font-black tracking-[-.06em]">Your profile.</h1>
        </div>

        <div className="mt-6 rounded-lg border border-[#101513]/15 bg-white p-6">
          <div className="mb-4 flex items-center gap-3 text-sm">
            <span className="rounded bg-[#f5f7f4] px-2 py-1 font-mono text-[10px] uppercase">Role: {profile.role}</span>
            {profile.role === 'business' && <span className="rounded bg-[#f5f7f4] px-2 py-1 font-mono text-[10px] uppercase">Verification: {profile.verification_status}</span>}
            <span className="rounded bg-[#f5f7f4] px-2 py-1 font-mono text-[10px] uppercase">Terms: {profile.terms_accepted ? 'Accepted' : 'Not accepted'}</span>
          </div>
          <form onSubmit={handleSave} className="space-y-4">
            <label className="block text-xs font-bold">Display name<input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="form-field mt-2" /></label>
            <label className="block text-xs font-bold">Bio<textarea rows={3} value={bio} onChange={(e) => setBio(e.target.value)} className="form-field mt-2 resize-none" placeholder="Tell people about your work" /></label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-xs font-bold">Location<input value={location} onChange={(e) => setLocation(e.target.value)} className="form-field mt-2" placeholder="City, India" /></label>
              <label className="block text-xs font-bold">Website<input type="url" value={website} onChange={(e) => setWebsite(e.target.value)} className="form-field mt-2" placeholder="https://yoursite.in" /></label>
            </div>
            {profile.role === 'creator' && (
              <>
                <label className="block text-xs font-bold">Skills (comma-separated)<input value={skills} onChange={(e) => setSkills(e.target.value)} className="form-field mt-2" placeholder="Design, Animation, Copywriting" /></label>
                <label className="block text-xs font-bold">Languages (comma-separated)<input value={languages} onChange={(e) => setLanguages(e.target.value)} className="form-field mt-2" placeholder="English, Hindi, Tamil" /></label>
              </>
            )}
            <button type="submit" className="primary-btn w-full justify-center">Save profile <ArrowRight size={15} /></button>
          </form>
        </div>

        {profile.role === 'business' && (
          <div className="mt-6 rounded-lg border-2 border-[#101513] bg-[#d9eecc] p-5">
            <h3 className="font-mono text-sm font-black">Business verification</h3>
            <p className="mt-2 text-sm text-[#56645a]">Status: <b>{profile.verification_status.replace(/_/g, ' ')}</b></p>
            <p className="mt-2 text-xs text-[#56645a]">Only verified businesses can publish public demands. Submit verification documents in your dashboard for admin review.</p>
          </div>
        )}
      </div>
      {notice && <div className="toast"><CheckCircle size={15} /> {notice}</div>}
    </main>
  );
}
