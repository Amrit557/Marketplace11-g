'use client';

import Link from 'next/link';
import { ArrowRight, Check, Sparkles, Star, Store, ShoppingBag, ShieldCheck, Zap } from 'lucide-react';

type Product = { id: string; title: string; category: string; price: number; rating: number; sales_count: number; creator_id: string };
type Demand = { id: string; title: string; budget: string; category: string; response_count: number; deadline: string };

const accentMap: Record<string, string> = {
  Design: 'citrus', 'Motion & 3D': 'sunset', Audio: 'violet', Photography: 'forest', Business: 'coral', Fonts: 'aqua',
  Education: 'citrus', 'Brand & Design': 'coral',
};

const sampleProducts: Product[] = [
  { id: '1', title: 'Monsoon Motion Pack', category: 'Motion & 3D', price: 1499, rating: 4.9, sales_count: 128, creator_id: '' },
  { id: '2', title: 'Indie Brand Toolkit', category: 'Design', price: 899, rating: 4.8, sales_count: 84, creator_id: '' },
  { id: '3', title: 'Sitar Loops: Night Raga', category: 'Audio', price: 699, rating: 5.0, sales_count: 61, creator_id: '' },
  { id: '4', title: 'Jaipur Type Foundry', category: 'Fonts', price: 1199, rating: 4.7, sales_count: 46, creator_id: '' },
];

const sampleDemands: Demand[] = [
  { id: '1', title: 'Need a playful Hindi learning kit for kids', budget: '₹35,000–₹60,000', category: 'Education', response_count: 12, deadline: '18 days left' },
  { id: '2', title: 'Regional food brand packaging system', budget: '₹20,000–₹40,000', category: 'Brand & Design', response_count: 8, deadline: '9 days left' },
  { id: '3', title: 'Original sound pack for a monsoon game', budget: '₹45,000–₹80,000', category: 'Audio', response_count: 17, deadline: '26 days left' },
];

const money = (v: number) => `₹${v.toLocaleString('en-IN')}`;

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f5f7f4] text-[#101513]">
      <header className="sticky top-0 z-30 border-b border-[#101513]/10 bg-[#f5f7f4]/95 backdrop-blur-md">
        <div className="mx-auto flex h-[70px] max-w-[1440px] items-center justify-between px-5 lg:px-10">
          <Link href="/" className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded bg-[#c8ff00] font-mono text-xl font-black shadow-[3px_3px_0_#101513]">K</span>
            <span className="font-mono text-sm font-black tracking-[-0.04em]">KRAFTO</span>
            <span className="hidden rounded border border-[#101513]/20 px-2 py-1 font-mono text-[9px] tracking-widest text-[#64706b] sm:inline">MARKETPLACE</span>
          </Link>
          <nav className="hidden items-center gap-7 text-xs font-semibold lg:flex">
            <Link href="/explore">Explore</Link>
            <Link href="/demands">Demand board</Link>
            <a href="#how">How it works</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login" className="secondary-btn">Sign in</Link>
            <Link href="/register" className="rounded-md bg-[#101513] px-4 py-2.5 text-xs font-bold text-white transition hover:-translate-y-0.5 hover:shadow-[3px_3px_0_#b4e900]">Get started <ArrowRight className="ml-1 inline" size={13} /></Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1440px] px-5 pb-16 lg:px-10">
        <section className="grid gap-7 border-b border-[#101513]/15 py-10 lg:grid-cols-[1.2fr_.8fr] lg:py-16">
          <div className="max-w-3xl">
            <div className="eyebrow"><span className="pulse-dot" /> MADE FOR INDIA&apos;S INDEPENDENT CREATORS</div>
            <h1 className="mt-6 max-w-4xl font-mono text-5xl font-black leading-[.94] tracking-[-0.08em] sm:text-7xl lg:text-[96px]">Create what people want.<br /><span className="text-[#708000]">Sell what you create.</span></h1>
            <p className="mt-7 max-w-xl text-lg leading-7 text-[#58635d]">A focused marketplace for original digital work, useful products, and real business demand. No noise. Just good work finding the right people.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/register" className="primary-btn">Get started free <ArrowRight size={16} /></Link>
              <Link href="/explore" className="secondary-btn">Explore the marketplace <Sparkles size={15} /></Link>
            </div>
            <div className="mt-10 flex flex-wrap gap-7 font-mono text-[10px] uppercase tracking-wider text-[#6b776f]">
              <span><b className="text-lg text-[#101513]">Original</b><br />creator-made work</span>
              <span><b className="text-lg text-[#101513]">Verified</b><br />business demands</span>
              <span><b className="text-lg text-[#101513]">Rights-first</b><br />reviewed listings</span>
            </div>
          </div>
          <div className="hero-art relative min-h-[330px] overflow-hidden rounded-lg border-2 border-[#101513] bg-[#d9eecc] p-5 shadow-[8px_8px_0_#101513]">
            <div className="absolute left-5 top-5 font-mono text-[10px] font-bold uppercase tracking-widest">01 / THE OPEN CANVAS</div>
            <div className="absolute right-5 top-5 rounded-full bg-[#c8ff00] px-2 py-1 font-mono text-[9px] font-black">A MARKETPLACE BUILT AROUND REAL NEEDS</div>
            <div className="hero-lines" /><div className="hero-orb" />
            <div className="absolute bottom-6 left-6 max-w-[230px] font-mono text-xl font-black leading-none tracking-tight">Great work should have a clear way forward.</div>
            <div className="absolute bottom-6 right-6 text-right font-mono text-[10px] font-bold">LOCAL TALENT<br /><span className="text-[#718000]">GLOBAL STANDARD</span></div>
          </div>
        </section>

        <section className="py-10">
          <div className="section-heading">
            <div><div className="eyebrow">01 / DISCOVER · SAMPLE STORE</div><h2>Work worth saving.</h2><p className="mt-2 text-xs text-[#68746c]">Illustrative sample listings—not live products or purchase offers.</p></div>
            <Link href="/explore" className="text-xs font-bold underline underline-offset-4">View all work <ArrowRight className="ml-1 inline" size={14} /></Link>
          </div>
          <div className="product-grid mt-6">
            {sampleProducts.map((product) => (
              <article key={product.id} className="product-card">
                <div className={`product-art ${accentMap[product.category] || 'citrus'}`}>
                  <span className="art-tag">{product.category.toUpperCase()}</span>
                  <span className="art-number">{product.sales_count} sales</span>
                  <div className="art-shape" />
                  <div className="art-label">{product.category}<br /><b>Commercial license</b></div>
                </div>
                <div className="flex items-start justify-between pt-3">
                  <div>
                    <h3 className="font-mono text-sm font-black tracking-tight">{product.title}</h3>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between font-mono text-[10px] text-[#66726b]">
                  <span><Star className="mr-1 inline text-[#879d00]" size={12} fill="currentColor" />{product.rating}</span>
                  <b className="text-sm text-[#101513]">{money(product.price)}</b>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="demand-strip my-4 grid gap-6 rounded-lg border-2 border-[#101513] p-6 lg:grid-cols-[.8fr_1.2fr] lg:p-9">
          <div>
            <div className="eyebrow">02 / OPPORTUNITY</div>
            <h2 className="mt-3 max-w-md font-mono text-4xl font-black leading-none tracking-[-.06em]">Don&apos;t wait for a brief. Find what&apos;s needed.</h2>
            <p className="mt-4 max-w-sm text-sm leading-6 text-[#546259]">Businesses publish real product gaps. Creators turn them into products — no bidding, no chasing.</p>
            <Link href="/demands" className="primary-btn mt-6">Browse demand board <ArrowRight size={15} /></Link>
          </div>
          <div className="space-y-3">
            <p className="font-mono text-[9px] font-bold uppercase tracking-widest text-[#56645a]">Illustrative examples · demo content</p>
            {sampleDemands.map((demand) => (
              <div key={demand.id} className="demand-row">
                <div className={`mini-art ${accentMap[demand.category] || 'citrus'}`}><span>{demand.category.slice(0, 2).toUpperCase()}</span></div>
                <div className="min-w-0 flex-1 text-left">
                  <h3 className="truncate font-mono text-sm font-black">{demand.title}</h3>
                  <p className="mt-1 text-xs text-[#68746c]">{demand.response_count} creators exploring</p>
                </div>
                <div className="hidden text-right sm:block">
                  <b className="font-mono text-xs">{demand.budget}</b>
                  <p className="mt-1 text-[10px] text-[#68746c]">{demand.deadline}</p>
                </div>
                <ArrowRight size={16} />
              </div>
            ))}
          </div>
        </section>

        <section id="how" className="py-14">
          <div className="eyebrow">03 / HOW IT WORKS</div>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {[
              { icon: <ShoppingBag size={20} />, num: '01', title: 'Buyers discover', copy: 'Browse original work from independent Indian creators. Add to cart and review checkout details; payment and delivery are being integrated.' , role: 'buyer' },
              { icon: <Sparkles size={20} />, num: '02', title: 'Creators sell', copy: 'Submit original work with rights declarations. Moderation is required before an item can publish; secure delivery is not enabled yet.' , role: 'creator' },
              { icon: <Store size={20} />, num: '03', title: 'Businesses demand', copy: 'Verified businesses can post genuine needs. Creators respond with linked product drafts; a response is not a purchase commitment.' , role: 'business' },
            ].map((item) => (
              <div key={item.num} className="border-t-2 border-[#101513] pt-4">
                <span className="font-mono text-xs text-[#77817b]">{item.num}</span>
                <div className="mt-6 text-[#101513]">{item.icon}</div>
                <h3 className="mt-4 font-mono text-2xl font-black tracking-tight">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-[#5b665f]">{item.copy}</p>
                <Link href={`/register?role=${item.role}`} className="mt-4 inline-flex items-center gap-1 text-xs font-bold underline">Get started as {item.role} <ArrowRight size={13} /></Link>
              </div>
            ))}
          </div>
        </section>

        <section className="py-14">
          <div className="eyebrow">04 / WHY KRAFTO</div>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {[['01', 'Built for the work', 'Your product gets a proper storefront, not a buried profile link.'], ['02', 'Demand over guesswork', 'See what businesses and buyers are actively looking for right now.'], ['03', 'Fair by default', 'Clear fees, secure delivery, and the rights to your work stay yours.']].map(([num, title, copy]) => (
              <div key={num} className="border-t-2 border-[#101513] pt-4">
                <span className="font-mono text-xs text-[#77817b]">{num}</span>
                <h3 className="mt-9 font-mono text-2xl font-black tracking-tight">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-[#5b665f]">{copy}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="my-10 rounded-lg border-2 border-[#101513] bg-[#101513] p-8 text-center text-white lg:p-14">
          <ShieldCheck size={32} className="mx-auto text-[#c8ff00]" />
          <h2 className="mt-5 font-mono text-4xl font-black tracking-[-.05em]">Ready to start?</h2>
          <p className="mx-auto mt-4 max-w-md text-sm text-white/60">Create an account in seconds. Choose your role. Start discovering, creating, or demanding.</p>
          <Link href="/register" className="mt-7 inline-flex items-center gap-2 rounded bg-[#c8ff00] px-6 py-3.5 text-sm font-bold text-[#101513] transition hover:-translate-y-0.5 hover:shadow-[3px_3px_0_#fff]">
            Create your account <ArrowRight size={16} />
          </Link>
        </section>

        <footer className="mt-20 border-t border-[#101513]/15 pt-8">
          <div className="grid gap-8 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
            <div>
              <div className="flex items-center gap-2">
                <span className="grid h-7 w-7 place-items-center rounded bg-[#c8ff00] font-mono font-black">K</span>
                <span className="font-mono text-sm font-black">KRAFTO</span>
              </div>
              <p className="mt-3 max-w-xs text-xs leading-5 text-[#68736c]">A rights-first marketplace for people who make, and the people looking for what they make.</p>
            </div>
            <FooterColumn title="Marketplace" items={[['Explore work', '/explore'], ['Demand board', '/demands'], ['How it works', '/#how']]} />
            <FooterColumn title="For business" items={[['Post a demand', '/register'], ['Business terms', '/legal/business-terms'], ['Contact support', '/contact']]} />
            <FooterColumn title="Policies" items={[
              ['Terms & Conditions', '/legal/terms'],
              ['Privacy policy', '/legal/privacy'],
              ['Refund / cancellation', '/legal/refunds'],
              ['Creator / seller terms', '/legal/creator-terms'],
              ['IP / copyright', '/legal/intellectual-property'],
              ['Prohibited content', '/legal/prohibited-content'],
              ['Grievance / Support', '/legal/grievance'],
              ['Contact', '/contact'],
            ]} />
          </div>
          <div className="mt-10 flex flex-wrap justify-between gap-3 border-t border-[#101513]/10 pt-4 font-mono text-[9px] uppercase tracking-wider text-[#7b857e]">
            <span>© {new Date().getFullYear()} KRAFTO MARKETPLACE</span>
            <span>Made with intent in India · <Link href="/legal/grievance" className="underline">Grievance &amp; support</Link></span>
          </div>
        </footer>
      </div>
    </main>
  );
}

function FooterColumn({ title, items }: { title: string; items: [string, string][] }) {
  return (
    <div>
      <h3 className="font-mono text-[10px] font-black uppercase tracking-widest">{title}</h3>
      <div className="mt-4 space-y-2 text-xs text-[#68736c]">
        {items.map(([label, href]) => <Link key={label} href={href} className="block hover:text-[#101513]">{label}</Link>)}
      </div>
    </div>
  );
}
