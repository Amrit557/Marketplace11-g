'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, CheckCircle, Download, Package } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { marketplaceApi, Order, OrderItem } from '@/lib/marketplace-api';

const money = (v: number) => `₹${v.toLocaleString('en-IN')}`;

export default function OrdersPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<(Order & { items: OrderItem[] })[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    const createdId = new URLSearchParams(window.location.search).get('created');
    if (createdId) setNotice(`Order ${createdId.slice(0, 8)} was saved as pending. No payment was taken.`);
  }, []);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  const loadOrders = useCallback(async () => {
    if (!user) return;
    const { data: orderData } = await marketplaceApi.from('orders').select('*').eq('buyer_id', user.id).order('created_at', { ascending: false });
    const orders = (orderData as Order[]) || [];
    const ordersWithItems = await Promise.all(
      orders.map(async (order) => {
        const { data: items } = await marketplaceApi.from('order_items').select('*').eq('order_id', order.id);
        const itemData = (items as OrderItem[]) || [];
        return { ...order, items: itemData };
      })
    );
    setOrders(ordersWithItems);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    loadOrders();
  }, [user, loadOrders]);

  if (loading) return <div className="grid min-h-screen place-items-center bg-[#f5f7f4]"><div className="font-mono text-sm text-[#68746c]">Loading orders...</div></div>;

  return (
    <main className="min-h-screen bg-[#f5f7f4] text-[#101513]">
      <header className="sticky top-0 z-30 border-b border-[#101513]/10 bg-[#f5f7f4]/95 backdrop-blur-md">
        <div className="mx-auto flex h-[70px] max-w-[1440px] items-center justify-between px-5 lg:px-10">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded bg-[#c8ff00] font-mono text-xl font-black shadow-[3px_3px_0_#101513]">K</span>
            <span className="font-mono text-sm font-black">KRAFTO</span>
          </Link>
          <Link href="/dashboard" className="rounded-md bg-[#101513] px-3 py-2 text-xs font-bold text-white">My space</Link>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-5 pb-20 lg:px-10">
        <div className="border-b border-[#101513]/15 py-10">
          <div className="eyebrow"><span className="pulse-dot" /> ORDERS / DOWNLOADS</div>
          <h1 className="mt-4 font-mono text-4xl font-black tracking-[-.06em]">Your purchases.</h1>
        </div>

        {orders.length === 0 ? (
          <div className="mt-8 rounded-lg border border-[#101513]/15 bg-white p-10 text-center">
            <Package className="mx-auto text-[#68746c]" />
            <p className="mt-3 font-mono font-bold">No orders yet.</p>
            <Link href="/explore" className="primary-btn mt-4 inline-flex justify-center">Browse marketplace <ArrowRight size={15} /></Link>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="rounded-lg border border-[#101513]/15 bg-white p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <b className="font-mono text-sm">Order {order.id.slice(0, 8)}</b>
                    <p className="mt-1 text-xs text-[#718078]">{money(order.total)} · {new Date(order.created_at).toLocaleDateString('en-IN')}</p>
                  </div>
                  <span className={`rounded px-2 py-1 text-[10px] font-bold uppercase ${order.status === 'paid' || order.status === 'delivered' ? 'bg-[#c8ff00]' : 'bg-[#f5f7f4]'}`}>{order.status}</span>
                </div>
                <div className="mt-4 space-y-2">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between border-t border-[#101513]/10 pt-3 text-sm">
                      <div>
                        <b>{item.product_title || 'Product'}</b>
                        <p className="mt-1 text-xs text-[#718078]">{item.product_category} · Sold by {item.creator_name} · {money(item.price)}</p>
                      </div>
                      {order.status === 'paid' && (
                        <button disabled title="Secure digital delivery is not configured yet." className="rounded border border-[#101513]/20 px-3 py-1.5 text-xs font-bold opacity-50">
                          <Download size={13} className="mr-1 inline" /> Delivery unavailable
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <div className="mt-4 space-y-1 border-t border-[#101513]/10 pt-3 font-mono text-xs text-[#718078]">
                  <div className="flex justify-between"><span>Subtotal</span><span>{money(order.subtotal)}</span></div>
                  <div className="flex justify-between"><span>Platform fee</span><span>{money(order.platform_fee)}</span></div>
                  <div className="flex justify-between"><span>Tax</span><span>{money(order.tax || 0)}</span></div>
                  <div className="flex justify-between pt-1 text-sm font-black text-[#101513]"><span>Total</span><span>{money(order.total)}</span></div>
                </div>
                {order.status === 'pending' && <p className="mt-3 text-xs leading-5 text-[#718078]">Payment is not configured. This order is not paid, and no digital delivery is available.</p>}
              </div>
            ))}
          </div>
        )}
      </div>
      {notice && <div className="toast"><CheckCircle size={15} /> {notice}</div>}
    </main>
  );
}
