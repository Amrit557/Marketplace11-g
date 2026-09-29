'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, ChevronDown, Plus, Search, ShieldCheck, Zap } from 'lucide-react';
import { marketplaceApi, Demand } from '@/lib/marketplace-api';

const accentMap: Record<string, string> = {
  Education: 'citrus', 'Brand & Design': 'coral', Audio: 'aqua', Design: 'citrus', Business: 'coral', Photography: 'forest', 'Motion & 3D': 'sunset', Fonts: 'aqua',
};

export default function DemandsPage() {
  const router = useRouter();
  const [demands, setDemands] = useState<Demand[]>([]);
  const [filtered, setFiltered] = useState<Demand[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    loadDemands();
  }, []);

  useEffect(() => {
    if (query) {
      setFiltered(demands.filter((d) => `${d.title} ${d.description ?? ''} ${d.category}`.toLowerCase().includes(query.toLowerCase())));
    } else {
      setFiltered(demands);
    }
  }, [demands, query]);

  const loadDemands = async () => {
    const { data, error } = await marketplaceApi.from('demands').select('*').eq('status', 'published').order('created_at', { ascending: false });
    if (error) setLoadError(error.message);
    setDemands((data as Demand[]) || []);
    setFiltered((data as Demand[]) || []);
    setLoading(false);
  };

  if (loading) return <div className="grid min-h-screen place-items-center bg-[#f5f7f4]"><div className="font-mono text-sm text-[#68746c]">Loading demand board...</div></div>;

  return (
    <main className="min-h-screen bg-[#f5f7f4] text-[#101513]">
      <header className="sticky top-0 z-30 border-b border-[#101513]/10 bg-[#f5f7f4]/95 backdrop-blur-md">
        <div className="mx-auto flex h-[70px] max-w-[1440px] items-center justify-between px-5 lg:px-10">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded bg-[#c8ff00] font-mono text-xl font-black shadow-[3px_3px_0_#101513]">K</span>
            <span className="font-mono text-sm font-black">KRAFTO</span>
          </Link>
          <nav className="hidden items-center gap-7 text-xs font-semibold lg:flex">
            <Link href="/explore">Explore</Link>
            <Link href="/demands" className="nav-active">Demand board</Link>
            <Link href="/dashboard">My space</Link>
          </nav>
          <Link href="/dashboard" className="rounded-md bg-[#101513] px-3 py-2 text-xs font-bold text-white">My space</Link>
        </div>
      </header>

      <div className="mx-auto max-w-[1440px] px-5 pb-16 lg:px-10">
        <section className="py-12">
          <div className="flex flex-col justify-between gap-5 border-b border-[#101513]/15 pb-8 lg:flex-row lg:items-end">
            <div>
              <div className="eyebrow"><span className="pulse-dot" /> DEMAND BOARD / VERIFIED BUSINESSES</div>
              <h1 className="mt-5 max-w-3xl font-mono text-5xl font-black leading-none tracking-[-.07em]">Make something that&apos;s already needed.</h1>
              <p className="mt-4 max-w-xl text-sm leading-6 text-[#68746c]">Browse public briefs from verified businesses. Creator responses are product proposals—not bids or purchase guarantees.</p>
            </div>
            <div className="flex items-center gap-2 rounded border border-[#101513]/20 bg-white px-3 py-2.5 lg:w-[300px]">
              <Search size={16} className="text-[#7a857d]" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search demands..." className="w-full bg-transparent text-sm outline-none" />
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="stat-card"><b>{filtered.length}</b><span>active demands</span></div>
            <div className="stat-card"><b>{filtered.reduce((s, d) => s + d.response_count, 0)}</b><span>creator responses</span></div>
            <div className="stat-card"><b>Verified</b><span>businesses only</span></div>
          </div>

          {filtered.length > 0 ? (
            <div className="mt-10 space-y-3">
              {filtered.map((demand) => (
                <button key={demand.id} onClick={() => router.push(`/demands/${demand.id}`)} className="demand-row">
                  <div className={`mini-art ${accentMap[demand.category] || 'citrus'}`}><span>{demand.category.slice(0, 2).toUpperCase()}</span></div>
                  <div className="min-w-0 flex-1 text-left">
                    <h3 className="truncate font-mono text-sm font-black">{demand.title}</h3>
                    <p className="mt-1 text-xs text-[#68746c]">{demand.category} · {demand.response_count} creators exploring</p>
                  </div>
                  <div className="hidden text-right sm:block">
                    <b className="font-mono text-xs">{demand.budget || 'Budget TBD'}</b>
                    <p className="mt-1 text-[10px] text-[#68746c]">{demand.deadline || 'Flexible'}</p>
                  </div>
                  <ArrowRight size={16} />
                </button>
              ))}
            </div>
          ) : (
            <div className="py-20 text-center">
              <Zap className="mx-auto text-[#68746c]" />
              <p className="mt-3 font-mono font-bold">{loadError ? 'Demand board is temporarily unavailable.' : 'No demands published yet.'}</p>
              {loadError && <p className="mt-2 text-sm text-red-700">{loadError}</p>}
              <p className="mt-1 text-sm text-[#68746c]">Businesses can post demands after verification. Creators can check back soon.</p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
