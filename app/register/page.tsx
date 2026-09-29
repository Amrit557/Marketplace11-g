'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Check, ShoppingBag, Sparkles, Store } from 'lucide-react';
import { marketplaceApi } from '@/lib/marketplace-api';

type Role = 'buyer' | 'creator' | 'business';

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<'role' | 'details'>('role');
  const [role, setRole] = useState<Role>('buyer');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [businessCategory, setBusinessCategory] = useState('');
  const [businessLocation, setBusinessLocation] = useState('');
  const [businessWebsite, setBusinessWebsite] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [creatorTerms, setCreatorTerms] = useState(false);
  const [businessTerms, setBusinessTerms] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const selectedRole = new URLSearchParams(window.location.search).get('role');
    if (selectedRole === 'buyer' || selectedRole === 'creator' || selectedRole === 'business') setRole(selectedRole);
  }, []);

  const roleOptions: { value: Role; label: string; desc: string; icon: React.ReactNode }[] = [
    { value: 'buyer', label: 'Buyer', desc: 'Discover and purchase good work', icon: <ShoppingBag size={17} /> },
    { value: 'creator', label: 'Creator / Seller', desc: 'Create, publish, and earn', icon: <Sparkles size={17} /> },
    { value: 'business', label: 'Business', desc: 'Post real product demands', icon: <Store size={17} /> },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!termsAccepted || !privacyAccepted) {
      setError('Please accept the Terms and Privacy Policy to continue.');
      return;
    }
    if (role === 'creator' && !creatorTerms) {
      setError('Please accept the Creator/Seller Agreement to continue.');
      return;
    }
    if (role === 'business' && !businessTerms) {
      setError('Please accept the Business Terms to continue.');
      return;
    }
    if (role === 'business' && !businessName) {
      setError('Business name is required for business accounts.');
      return;
    }

    setLoading(true);

    const { data, error: signUpError } = await marketplaceApi.auth.signUp({
      email,
      password,
      options: { data: {
        display_name: displayName,
        role,
        business_name: businessName,
        business_category: businessCategory,
        location: businessLocation,
        website: businessWebsite,
        terms_accepted: termsAccepted,
        privacy_accepted: privacyAccepted,
        age_confirmed: ageConfirmed,
        creator_terms_accepted: creatorTerms,
        business_terms_accepted: businessTerms,
      } },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    router.push('/dashboard');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f5f7f4] px-5 py-10">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-8 flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded bg-[#c8ff00] font-mono text-xl font-black shadow-[3px_3px_0_#101513]">K</span>
          <span className="font-mono text-sm font-black tracking-[-0.04em]">KRAFTO</span>
        </Link>
        <div className="rounded-lg border-2 border-[#101513] bg-white p-7 shadow-[6px_6px_0_#101513]">
          <div className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-widest text-[#68746c]">
            <span className={step === 'role' ? 'text-[#101513]' : ''}>01 / Role</span>
            <span className="text-[#101513]/30">→</span>
            <span className={step === 'details' ? 'text-[#101513]' : ''}>02 / Details</span>
          </div>

          {step === 'role' && (
            <>
              <h1 className="mt-5 font-mono text-3xl font-black tracking-tight">Choose your role.</h1>
              <p className="mt-2 text-sm text-[#68746c]">Each account starts in one clearly scoped workspace.</p>
              <div className="mt-6 space-y-2">
                {roleOptions.map((opt) => (
                  <button key={opt.value} onClick={() => setRole(opt.value)} className={`role-option ${role === opt.value ? 'selected' : ''}`}>
                    <span className="grid h-9 w-9 place-items-center rounded bg-[#101513] text-[#c8ff00]">{opt.icon}</span>
                    <span className="flex-1 text-left"><b>{opt.label}</b><small>{opt.desc}</small></span>
                    {role === opt.value && <Check size={17} />}
                  </button>
                ))}
              </div>
              <button className="primary-btn mt-6 w-full justify-center" onClick={() => setStep('details')}>Continue <ArrowRight size={16} /></button>
            </>
          )}

          {step === 'details' && (
            <>
              <h1 className="mt-5 font-mono text-3xl font-black tracking-tight">Tell us about you.</h1>
              <p className="mt-2 text-sm text-[#68746c]">Registering as <b className="text-[#101513]">{role}</b>.</p>
              {error && <div className="mt-4 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <label className="block"><span className="text-xs font-bold">Display name</span><input required value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="form-field mt-2" placeholder="Your name" /></label>
                {role === 'business' && (
                  <>
                    <label className="block"><span className="text-xs font-bold">Business name</span><input required value={businessName} onChange={(e) => setBusinessName(e.target.value)} className="form-field mt-2" placeholder="Company name" /></label>
                    <label className="block"><span className="text-xs font-bold">Business category</span><input value={businessCategory} onChange={(e) => setBusinessCategory(e.target.value)} className="form-field mt-2" placeholder="e.g. Education, FMCG..." /></label>
                    <label className="block"><span className="text-xs font-bold">Business location</span><input value={businessLocation} onChange={(e) => setBusinessLocation(e.target.value)} className="form-field mt-2" placeholder="City, India" /></label>
                    <label className="block"><span className="text-xs font-bold">Website or public profile</span><input type="url" value={businessWebsite} onChange={(e) => setBusinessWebsite(e.target.value)} className="form-field mt-2" placeholder="https://" /></label>
                  </>
                )}
                <label className="block"><span className="text-xs font-bold">Email</span><input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="form-field mt-2" placeholder="you@example.com" /></label>
                <label className="block"><span className="text-xs font-bold">Password</span><input type="password" required minLength={10} value={password} onChange={(e) => setPassword(e.target.value)} className="form-field mt-2" placeholder="At least 10 characters" /></label>
                <label className="flex items-start gap-3 rounded border border-[#101513]/20 bg-[#f5f7f4] p-3 text-xs leading-5">
                  <input type="checkbox" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} className="mt-1 accent-[#101513]" />
                  I accept the <Link href="/legal/terms" target="_blank" className="font-bold underline">Terms &amp; Conditions</Link> (v1.0)
                </label>
                <label className="flex items-start gap-3 rounded border border-[#101513]/20 bg-[#f5f7f4] p-3 text-xs leading-5">
                  <input type="checkbox" checked={privacyAccepted} onChange={(e) => setPrivacyAccepted(e.target.checked)} className="mt-1 accent-[#101513]" />
                  I accept the <Link href="/legal/privacy" target="_blank" className="font-bold underline">Privacy Policy</Link> and consent to data processing (v1.0)
                </label>
                <label className="flex items-start gap-3 rounded border border-[#101513]/20 bg-[#f5f7f4] p-3 text-xs leading-5">
                  <input type="checkbox" checked={ageConfirmed} onChange={(e) => setAgeConfirmed(e.target.checked)} className="mt-1 accent-[#101513]" />
                  I confirm I meet the marketplace&apos;s configured minimum age requirement.
                </label>
                {role === 'creator' && (
                  <label className="flex items-start gap-3 rounded border border-[#101513]/20 bg-[#f5f7f4] p-3 text-xs leading-5">
                    <input type="checkbox" checked={creatorTerms} onChange={(e) => setCreatorTerms(e.target.checked)} className="mt-1 accent-[#101513]" />
                    I accept the <Link href="/legal/creator-terms" target="_blank" className="font-bold underline">Creator/Seller Agreement</Link>, IP declaration, and Payout/Commission terms (v1.0)
                  </label>
                )}
                {role === 'business' && (
                  <label className="flex items-start gap-3 rounded border border-[#101513]/20 bg-[#f5f7f4] p-3 text-xs leading-5">
                    <input type="checkbox" checked={businessTerms} onChange={(e) => setBusinessTerms(e.target.checked)} className="mt-1 accent-[#101513]" />
                    I accept the <Link href="/legal/business-terms" target="_blank" className="font-bold underline">Business Terms</Link> and understand public demands require business verification (v1.0)
                  </label>
                )}
                <div className="flex gap-3">
                  <button type="button" className="secondary-btn flex-1 justify-center" onClick={() => setStep('role')}>Back</button>
                  <button type="submit" disabled={loading} className="primary-btn flex-1 justify-center disabled:opacity-50">
                    {loading ? 'Creating...' : 'Create account'} <ArrowRight size={16} />
                  </button>
                </div>
              </form>
              <p className="mt-5 text-center text-sm text-[#68746c]">
                Already have an account? <Link href="/login" className="font-bold text-[#101513] underline">Sign in</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
