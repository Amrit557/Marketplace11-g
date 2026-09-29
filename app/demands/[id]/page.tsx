'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { Demand, marketplaceApi } from '@/lib/marketplace-api';
import { DEMO_MODE } from '@/lib/demo-mode';

export default function DemandDetailsPage() {
  const params = useParams();
  const demandId = String(params.id);
  const router = useRouter();
  const { user, profile } = useAuth();
  const [demand, setDemand] = useState<Demand | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [rightsConfirmed, setRightsConfirmed] = useState(false);

  useEffect(() => {
    marketplaceApi.from('demands').select('*').eq('id', demandId).maybeSingle().then(({ data, error }) => {
      if (error) setNotice(error.message);
      else setDemand(data as Demand | null);
      setLoading(false);
    });
  }, [demandId]);

  const submitLinkedProduct = async (event: FormEvent) => {
    event.preventDefault();
    if (!user || !demand || !rightsConfirmed) return;
    setSubmitting(true);
    setNotice('');
    if (DEMO_MODE) {
      const { data, error } = await marketplaceApi.respondToDemand(demand.id, {
        title,
        category,
        description,
        price: Number(price),
        ipDeclarationAccepted: rightsConfirmed,
      });
      if (error || !data) {
        setNotice(error?.message || 'The linked product draft could not be submitted.');
        setSubmitting(false);
        return;
      }
      router.push('/dashboard');
      return;
    }
    try {
      const response = await fetch(`/api/demands/${demand.id}/responses`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ title, category, description, price: Number(price), ipDeclarationAccepted: rightsConfirmed }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'The linked product draft could not be submitted.');
      router.push('/dashboard');
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'The linked product draft could not be submitted.');
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f5f7f4] text-[#101513]">
      <header className="sticky top-0 z-30 border-b border-[#101513]/10 bg-[#f5f7f4]/95 backdrop-blur-md">
        <div className="mx-auto flex h-[70px] max-w-[1000px] items-center justify-between px-5">
          <Link href="/" className="font-mono text-sm font-black">KRAFTO</Link>
          <Link href="/demands" className="secondary-btn"><ArrowLeft size={14} /> Demand board</Link>
        </div>
      </header>
      <div className="mx-auto grid max-w-[1000px] gap-8 px-5 py-12 lg:grid-cols-[1.2fr_.8fr]">
        <section>
          <div className="eyebrow"><span className="pulse-dot" /> VERIFIED BUSINESS DEMAND</div>
          {loading ? <p className="mt-8 text-sm text-[#68746c]">Loading demand...</p> : demand ? (
            <>
              <h1 className="mt-5 font-mono text-4xl font-black tracking-[-.06em]">{demand.title}</h1>
              <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-[#58635d]">{demand.description || 'The business has not added more details.'}</p>
              <div className="mt-7 grid grid-cols-2 gap-3">
                <div className="stat-card"><b className="text-base">{demand.category}</b><span>category</span></div>
                <div className="stat-card"><b className="text-base">{demand.budget || 'Not specified'}</b><span>indicative budget</span></div>
                <div className="stat-card"><b className="text-base">{demand.deadline || 'Flexible'}</b><span>deadline</span></div>
                <div className="stat-card"><b className="text-base">{demand.response_count}</b><span>creator responses</span></div>
              </div>
              <div className="mt-6 rounded border border-[#101513]/15 bg-white p-4 text-xs leading-5 text-[#68746c]">
                Creator responses do not guarantee a purchase. Any product you create is reviewed before publication and may be discovered by the business or other marketplace buyers.
              </div>
            </>
          ) : <p className="mt-8 text-sm text-[#68746c]">This demand is not available.</p>}
        </section>

        {demand && (
          <aside className="h-fit rounded-lg border-2 border-[#101513] bg-white p-5 shadow-[5px_5px_0_#101513]">
            <ShieldCheck size={21} />
            <h2 className="mt-4 font-mono text-xl font-black">Create for this demand</h2>
            {profile?.role === 'creator' ? (
              <>
                <p className="mt-2 text-xs leading-5 text-[#68746c]">Start a product listing linked to this demand. It will enter moderation before it can appear in the marketplace.</p>
                <form onSubmit={submitLinkedProduct} className="mt-5 space-y-3">
                  <label className="block text-xs font-bold">Product title<input required maxLength={160} value={title} onChange={(event) => setTitle(event.target.value)} className="form-field mt-2" /></label>
                  <label className="block text-xs font-bold">Category<input required value={category} onChange={(event) => setCategory(event.target.value)} className="form-field mt-2" /></label>
                  <label className="block text-xs font-bold">Price (INR)<input required type="number" min="1" step="1" value={price} onChange={(event) => setPrice(event.target.value)} className="form-field mt-2" /></label>
                  <label className="block text-xs font-bold">Description<textarea required maxLength={10000} rows={4} value={description} onChange={(event) => setDescription(event.target.value)} className="form-field mt-2 resize-none" /></label>
                  <label className="flex items-start gap-2 text-xs leading-5">
                    <input type="checkbox" checked={rightsConfirmed} onChange={(event) => setRightsConfirmed(event.target.checked)} className="mt-1 accent-[#101513]" />
                    I have all rights and permissions necessary to sell this work.
                  </label>
                  <button disabled={!rightsConfirmed || submitting} className="primary-btn w-full justify-center disabled:opacity-50">
                    {submitting ? 'Submitting...' : 'Submit linked product for review'} <ArrowRight size={14} />
                  </button>
                </form>
              </>
            ) : (
              <div className="mt-3 text-sm text-[#68746c]">
                <p>Sign in with a creator account to draft a linked product for moderation.</p>
                <div className="mt-4 flex gap-2">
                  <Link href={user ? '/dashboard' : '/login'} className="primary-btn">Continue <ArrowRight size={14} /></Link>
                  {!user && <Link href="/register" className="secondary-btn">Join as creator</Link>}
                </div>
              </div>
            )}
          </aside>
        )}
      </div>
      {notice && <div role="status" className="toast">{notice}</div>}
    </main>
  );
}
