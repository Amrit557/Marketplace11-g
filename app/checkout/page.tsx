'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, CheckCircle, ShieldCheck, ShoppingBag } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { marketplaceApi, Product } from '@/lib/marketplace-api';

const money = (v: number) => `₹${v.toLocaleString('en-IN')}`;

export default function CheckoutPage() {
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();
  const [cart, setCart] = useState<Product[]>([]);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [notice, setNotice] = useState('');
  const [commissionBps, setCommissionBps] = useState(500);
  const [taxBps, setTaxBps] = useState(0);

  const loadCheckoutConfig = async (items: Product[]) => {
    const { data: config, error } = await marketplaceApi.checkout.getConfig(items.map((product) => product.id));
    if (error || !config) throw new Error(error?.message || 'Checkout configuration could not be loaded.');
    setCommissionBps(config.commissionBps);
    setTaxBps(config.taxBps);
    if (Array.isArray(config.products) && items.length) {
      const available = new Map((config.products as Product[]).map((product) => [product.id, product]));
      const refreshed = items.flatMap((item) => {
        const verified = available.get(item.id);
        return verified ? [{ ...item, ...verified }] : [];
      });
      if (refreshed.length !== items.length) setNotice('Some cart products are no longer available and were removed.');
      setCart(refreshed);
      localStorage.setItem('krafto_cart', JSON.stringify(refreshed));
    }
  };

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    let savedCart: Product[] = [];
    try {
      const stored = localStorage.getItem('krafto_cart');
      if (stored) {
        const parsed: unknown = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          savedCart = parsed.filter((item): item is Product => Boolean(item && typeof item.id === 'string' && typeof item.price === 'number'));
          setCart(savedCart);
        }
      }
    } catch (error) {
      console.error('Unable to read the saved cart.', error);
      setNotice('Your saved cart could not be read. Please add the products again.');
    }
    loadCheckoutConfig(savedCart).catch((error) => {
      console.error('Unable to load checkout configuration.', error);
      setNotice(error instanceof Error ? error.message : 'Checkout pricing configuration is unavailable.');
    });
  }, []);

  const subtotal = cart.reduce((s, p) => s + p.price, 0);
  const platformFee = Math.round(subtotal * commissionBps / 10000);
  const tax = Math.round((subtotal + platformFee) * taxBps / 10000);
  const total = subtotal + platformFee + tax;

  const handleCheckout = async () => {
    if (!user || !termsAccepted || cart.length === 0) return;
    setProcessing(true);
    try {
      const { data, error } = await marketplaceApi.checkout.createOrder({
        productIds: cart.map((product) => product.id),
        termsAccepted,
        expectedSubtotal: subtotal,
        expectedPlatformFee: platformFee,
        expectedTax: tax,
      });
      if (error || !data) throw new Error(error?.message || 'Payment could not be initiated.');
      localStorage.removeItem('krafto_cart');
      router.push(`/orders?created=${encodeURIComponent(data.orderId)}`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Payment could not be initiated.');
    } finally {
      setProcessing(false);
    }
  };

  if (authLoading) return <div className="grid min-h-screen place-items-center bg-[#f5f7f4]"><div className="font-mono text-sm text-[#68746c]">Loading...</div></div>;

  return (
    <main className="min-h-screen bg-[#f5f7f4] text-[#101513]">
      <header className="sticky top-0 z-30 border-b border-[#101513]/10 bg-[#f5f7f4]/95 backdrop-blur-md">
        <div className="mx-auto flex h-[70px] max-w-[1440px] items-center justify-between px-5 lg:px-10">
          <Link href="/explore" className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded bg-[#c8ff00] font-mono text-xl font-black shadow-[3px_3px_0_#101513]">K</span>
            <span className="font-mono text-sm font-black">KRAFTO</span>
          </Link>
          <Link href="/dashboard" className="rounded-md bg-[#101513] px-3 py-2 text-xs font-bold text-white">My space</Link>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-5 pb-20 lg:px-10">
        <div className="border-b border-[#101513]/15 py-10">
          <div className="eyebrow"><span className="pulse-dot" /> CHECKOUT / SECURE</div>
          <h1 className="mt-4 font-mono text-4xl font-black tracking-[-.06em]">Complete your purchase.</h1>
        </div>

        {cart.length === 0 ? (
          <div className="mt-8 rounded-lg border border-[#101513]/15 bg-white p-10 text-center">
            <ShoppingBag className="mx-auto text-[#68746c]" />
            <p className="mt-3 font-mono font-bold">Your cart is empty.</p>
            <Link href="/explore" className="primary-btn mt-4 inline-flex justify-center">Browse marketplace <ArrowRight size={15} /></Link>
          </div>
        ) : (
          <>
            <div className="mt-6 rounded-lg border border-[#101513]/15 bg-white p-6">
              <h2 className="font-mono text-sm font-black">Order summary</h2>
              <div className="mt-4 space-y-3">
                {cart.map((item) => (
                  <div key={item.id} className="flex justify-between border-b border-[#101513]/10 pb-3 text-sm last:border-0">
                    <span>{item.title}<small className="mt-1 block text-xs text-[#718078]">{item.seller_name ? `Sold by ${item.seller_name} · ` : ''}Digital delivery · {item.category}</small></span>
                    <b>{money(item.price)}</b>
                  </div>
                ))}
              </div>
              <div className="mt-5 space-y-2 border-t border-[#101513]/10 pt-5 font-mono text-xs">
                <div className="flex justify-between"><span>Subtotal</span><span>{money(subtotal)}</span></div>
                <div className="flex justify-between"><span>Platform fee ({(commissionBps / 100).toFixed(2)}%)</span><span>{money(platformFee)}</span></div>
                <div className="flex justify-between"><span>Estimated tax (configured rate)</span><span>{money(tax)}</span></div>
                <div className="mt-3 flex justify-between text-base font-black"><span>Total</span><span>{money(total)}</span></div>
              </div>
            </div>

            <div className="mt-6 rounded-lg border border-[#101513]/15 bg-white p-6">
              <h2 className="font-mono text-sm font-black">Payment status</h2>
              <p className="mt-3 text-xs leading-5 text-[#718078]">Payment is not enabled yet. Placing this order records it as pending and does not charge you. Payment can only be completed after a supported provider and verified webhook are configured.</p>
            </div>

            <div className="mt-6 rounded-lg border border-[#101513]/15 bg-[#f5f7f4] p-4 text-xs leading-5">
              <b>Refund information:</b> Applicable product-specific refund, cancellation, and delivery terms must be reviewed before purchase. <Link href="/legal/refunds" className="font-bold underline">Review the draft policy</Link>; final rules require legal review before launch.
            </div>

            <label className="mt-6 flex items-start gap-3 text-xs leading-5">
              <input type="checkbox" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} className="mt-1 accent-[#101513]" />
              I agree to the <Link href="/legal/terms" className="font-bold underline">purchase terms</Link> and applicable <Link href="/legal/refunds" className="font-bold underline">refund policy</Link>.
            </label>

            <button onClick={handleCheckout} disabled={!termsAccepted || processing} className="primary-btn mt-6 w-full justify-center disabled:opacity-50">
              {processing ? 'Creating your order...' : `Place order · ${money(total)}`} <ShieldCheck size={15} />
            </button>
          </>
        )}
      </div>
      {notice && <div className="toast"><CheckCircle size={15} /> {notice}</div>}
    </main>
  );
}
