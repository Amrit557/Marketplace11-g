'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Bell, Heart, LogOut, Package, Plus, Search, Settings, ShoppingBag, Sparkles, Star, Store, Zap, ShieldCheck, CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { marketplaceApi, Product, Demand, Order, OrderItem, Notification } from '@/lib/marketplace-api';

type ProductRequest = { id: string; category: string; description: string; status: string };

export default function DashboardPage() {
  const router = useRouter();
  const { user, profile, loading, signOut } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [demands, setDemands] = useState<Demand[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [storeProducts, setStoreProducts] = useState<Product[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [showDemand, setShowDemand] = useState(false);
  const [showRequest, setShowRequest] = useState(false);
  const [productRequests, setProductRequests] = useState<ProductRequest[]>([]);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const loadData = useCallback(async () => {
    if (!user || !profile) return;

    const { data: publishedProducts } = await marketplaceApi
      .from('products')
      .select('*')
      .eq('status', 'published')
      .order('created_at', { ascending: false });
    setStoreProducts((publishedProducts as Product[]) || []);

    if (profile.role === 'buyer') {
      const { data: buyerOrders } = await marketplaceApi
        .from('orders')
        .select('*')
        .eq('buyer_id', user.id)
        .order('created_at', { ascending: false });
      const buyerOrderRecords = (buyerOrders as Order[] | null) || [];
      setOrders(buyerOrderRecords);

      if (buyerOrderRecords.length > 0) {
        const orderIds = buyerOrderRecords.map((o) => o.id);
        const { data: items } = await marketplaceApi
          .from('order_items')
          .select('*')
          .in('order_id', orderIds);
        setOrderItems((items as OrderItem[]) || []);
      }

      const { data: wishlisted } = await marketplaceApi
        .from('wishlists')
        .select('product_id, products(*)')
        .eq('user_id', user.id);
      const wishProducts = ((wishlisted as { product_id: string; products: Product }[] | null) || []).map((w) => w.products).filter(Boolean);
      setWishlist(wishProducts);

      const { data: requests } = await marketplaceApi.from('product_requests').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      setProductRequests((requests as ProductRequest[]) || []);
    }

    if (profile.role === 'creator') {
      const { data: myProducts } = await marketplaceApi
        .from('products')
        .select('*')
        .eq('creator_id', user.id)
        .order('created_at', { ascending: false });
      setProducts((myProducts as Product[]) || []);
    }

    if (profile.role === 'business') {
      const { data: myDemands } = await marketplaceApi
        .from('demands')
        .select('*')
        .eq('business_id', user.id)
        .order('created_at', { ascending: false });
      setDemands((myDemands as Demand[]) || []);
    }

    const { data: notifs } = await marketplaceApi
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);
    setNotifications((notifs as Notification[]) || []);
  }, [user, profile]);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user, profile, loadData]);

  const showNoticeMsg = (msg: string) => {
    setNotice(msg);
    window.setTimeout(() => setNotice(''), 3000);
  };

  const handleCreateProduct = async (data: { title: string; description: string; category: string; price: number; ip_declaration_accepted: boolean }) => {
    if (!user) return;
    const { error } = await marketplaceApi.from('products').insert({
      creator_id: user.id,
      title: data.title,
      description: data.description,
      category: data.category,
      price: data.price,
      status: 'moderation',
      ip_declaration_accepted: data.ip_declaration_accepted,
      is_digital: true,
      license_type: 'commercial',
      language: 'English',
    });
    if (error) {
      showNoticeMsg('Error creating product: ' + error.message);
      return;
    }
    setShowCreate(false);
    showNoticeMsg('Product submitted for moderation.');
    loadData();
  };

  const handleCreateDemand = async (data: { title: string; description: string; category: string; budget: string; deadline: string }) => {
    if (!user) return;
    const { error } = await marketplaceApi.from('demands').insert({
      business_id: user.id,
      title: data.title,
      description: data.description,
      category: data.category,
      budget: data.budget,
      deadline: data.deadline,
      status: 'moderation',
      genuine_requirement_confirmed: true,
      is_digital: true,
      language: 'English',
      visibility: 'public',
    });
    if (error) {
      showNoticeMsg('Error creating demand: ' + error.message);
      return;
    }
    setShowDemand(false);
    showNoticeMsg('Demand submitted for verification.');
    loadData();
  };

  const handleCreateRequest = async (data: { description: string; category: string }) => {
    const { error } = await marketplaceApi.from('product_requests').insert(data);
    if (error) {
      showNoticeMsg(`Product request failed: ${error.message}`);
      return;
    }
    setShowRequest(false);
    showNoticeMsg('Your private product request was saved as an internal demand signal.');
    await loadData();
  };

  if (loading) {
    return <div className="grid min-h-screen place-items-center bg-[#f5f7f4]"><div className="font-mono text-sm text-[#68746c]">Loading your workspace...</div></div>;
  }

  if (!profile) {
    return <div className="grid min-h-screen place-items-center bg-[#f5f7f4]"><div className="font-mono text-sm text-[#68746c]">Setting up your profile...</div></div>;
  }

  const role = profile.role;
  const money = (v: number) => `₹${v.toLocaleString('en-IN')}`;
  const isCreator = role === 'creator';
  const isBusiness = role === 'business';
  const isAdmin = role === 'admin';
  const isBuyer = role === 'buyer';

  const stats = isAdmin
    ? [['Review queue', 'open admin panel'], ['Verification', 'admin review required'], ['Safety reports', 'admin review required'], ['Disabled', 'payment volume']]
    : isCreator
    ? [['—', 'earnings (payouts unavailable)'], [String(products.filter((p) => p.status === 'published').length), 'products live'], [String(products.filter((p) => p.status === 'moderation').length), 'in moderation'], [String(products.reduce((s, p) => s + p.sales_count, 0)), 'total sales']]
    : isBusiness
    ? [[String(demands.filter((d) => d.status === 'published').length), 'active demands'], [String(demands.filter((d) => d.status === 'moderation').length), 'in review'], [String(demands.reduce((s, d) => s + d.response_count, 0)), 'creator responses'], [profile.verification_status === 'verified' ? 'Verified' : 'Pending', 'business status']]
    : [[String(orders.filter((o) => o.status === 'paid' || o.status === 'delivered').length), 'orders completed'], [String(wishlist.length), 'saved products'], ['—', 'refunds (not integrated)'], [String(storeProducts.length), 'products available']];

  return (
    <main className="min-h-screen bg-[#f5f7f4] text-[#101513]">
      <header className="sticky top-0 z-30 border-b border-[#101513]/10 bg-[#f5f7f4]/95 backdrop-blur-md">
        <div className="mx-auto flex h-[70px] max-w-[1440px] items-center justify-between px-5 lg:px-10">
          <Link href="/" className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded bg-[#c8ff00] font-mono text-xl font-black shadow-[3px_3px_0_#101513]">K</span>
            <span className="font-mono text-sm font-black tracking-[-0.04em]">KRAFTO</span>
          </Link>
          <nav className="hidden items-center gap-7 text-xs font-semibold lg:flex">
            <Link href="/explore">Explore marketplace</Link>
            <Link href="/demands">Demand board</Link>
            <button onClick={() => showNoticeMsg('How it works: discover, create, and sell with clarity.')}>How it works</button>
          </nav>
          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-2 rounded-md border border-[#101513]/20 px-3 py-2 text-xs font-bold sm:flex">
              <span className="grid h-5 w-5 place-items-center rounded-full bg-[#101513] text-[10px] text-[#c8ff00]">{role[0].toUpperCase()}</span>
              {role[0].toUpperCase() + role.slice(1)}
            </div>
            <button onClick={signOut} className="rounded-md border border-[#101513]/20 p-2" title="Sign out"><LogOut size={16} /></button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1440px] px-5 pb-20 lg:px-10">
        <div className="flex flex-col justify-between gap-4 border-b border-[#101513]/15 py-10 md:flex-row md:items-end">
          <div>
            <div className="eyebrow"><span className="pulse-dot" /> MY SPACE / {role.toUpperCase()}</div>
            <h1 className="mt-4 font-mono text-5xl font-black tracking-[-.07em]">Hi, {profile.display_name}.</h1>
            <p className="mt-3 text-sm text-[#68746c]">Here&apos;s what&apos;s happening in your workspace.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {isBuyer && <button className="secondary-btn" onClick={() => router.push('/explore')}><Search size={15} /> Browse marketplace</button>}
            {isBuyer && <button className="secondary-btn" onClick={() => setShowRequest(true)}><Plus size={15} /> Request a product</button>}
            {(isBuyer || isCreator) && <button className="secondary-btn" onClick={() => router.push('/demands')}><Zap size={15} /> Demand board</button>}
            {isCreator && <button className="primary-btn" onClick={() => setShowCreate(true)}><Plus size={15} /> Create product</button>}
            {isBusiness && <button className="primary-btn" onClick={() => setShowDemand(true)} disabled={profile.verification_status !== 'verified'}><Plus size={15} /> Post demand</button>}
            {isAdmin && <Link href="/admin" className="primary-btn"><ShieldCheck size={15} /> Admin panel</Link>}
            <button className="secondary-btn" onClick={() => router.push('/settings')}><Settings size={15} /> Settings</button>
          </div>
        </div>

        {isBusiness && profile.verification_status !== 'verified' && (
          <div className="mt-6 flex items-center gap-3 rounded-lg border-2 border-[#101513] bg-[#d9eecc] p-4">
            {profile.verification_status === 'pending' && <Clock size={20} />}
            {profile.verification_status === 'additional_info_required' && <AlertCircle size={20} />}
            {profile.verification_status === 'rejected' && <XCircle size={20} />}
            <div className="flex-1 text-sm">
              <b>Business verification: {profile.verification_status.replace(/_/g, ' ')}</b>
              {profile.verification_status === 'pending' && <p className="text-[#56645a]">Your verification is under review. You&apos;ll be notified once approved. Only verified businesses can publish demands.</p>}
              {profile.verification_status === 'additional_info_required' && <p className="text-[#56645a]">Please provide additional information in settings to complete verification.</p>}
              {profile.verification_status === 'rejected' && <p className="text-[#56645a]">Your verification was rejected. Please update your information and try again.</p>}
            </div>
          </div>
        )}

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map(([value, label]) => (
            <div className="stat-card" key={label}><b>{value}</b><span>{label}</span></div>
          ))}
        </div>

        {isCreator && <FirstTenSales products={products} />}

        <div className="mt-10 grid gap-8 lg:grid-cols-[1.2fr_.8fr]">
          <div>
            <div className="section-heading">
              <h2>{isBuyer ? 'Your orders' : isCreator ? 'Your products' : isBusiness ? 'Your demands' : 'Pending reviews'}</h2>
              {isBuyer && <Link href="/explore" className="text-xs font-bold underline">Browse marketplace</Link>}
            </div>
            <div className="mt-4 overflow-hidden rounded border border-[#101513]/15 bg-white">
              {isBuyer && (orders.length > 0 ? orders.map((order) => (
                <div key={order.id} className="border-b border-[#101513]/10 p-4 text-sm last:border-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <b>Order {order.id.slice(0, 8)}</b>
                      <p className="mt-1 text-xs text-[#718078]">{money(order.total)} · {order.status}</p>
                    </div>
                    <span className={`rounded px-2 py-1 text-[10px] font-bold uppercase ${order.status === 'paid' ? 'bg-[#c8ff00]' : order.status === 'delivered' ? 'bg-[#d9eecc]' : 'bg-[#f5f7f4]'}`}>{order.status}</span>
                  </div>
                </div>
              )) : <div className="p-7 text-sm text-[#68746c]">No orders yet. Start exploring the marketplace to find great work.</div>)}

              {isBuyer && productRequests.map((request) => (
                <div key={request.id} className="border-t border-[#101513]/10 p-4 text-sm">
                  <b>Product request · {request.category}</b>
                  <p className="mt-1 text-xs text-[#718078]">{request.description} · {request.status}</p>
                </div>
              ))}

              {isCreator && (products.length > 0 ? products.map((product) => (
                <div key={product.id} className="flex items-center justify-between border-b border-[#101513]/10 p-4 text-sm last:border-0">
                  <div>
                    <b>{product.title}</b>
                    <p className="mt-1 text-xs text-[#718078]">{money(product.price)} · {product.category}</p>
                  </div>
                  <span className={`rounded px-2 py-1 text-[10px] font-bold uppercase ${product.status === 'published' ? 'bg-[#c8ff00]' : product.status === 'moderation' ? 'bg-[#ffe89d]' : product.status === 'rejected' ? 'bg-[#ffcccc]' : 'bg-[#f5f7f4]'}`}>{product.status}</span>
                </div>
              )) : <div className="p-7 text-sm text-[#68746c]">No products yet. Click &ldquo;Create product&rdquo; to publish your first one.</div>)}

              {isBusiness && (demands.length > 0 ? demands.map((demand) => (
                <div key={demand.id} className="flex items-center justify-between border-b border-[#101513]/10 p-4 text-sm last:border-0">
                  <div>
                    <b>{demand.title}</b>
                    <p className="mt-1 text-xs text-[#718078]">{demand.budget || 'Budget TBD'} · {demand.response_count} responses</p>
                  </div>
                  <span className={`rounded px-2 py-1 text-[10px] font-bold uppercase ${demand.status === 'published' ? 'bg-[#c8ff00]' : demand.status === 'moderation' ? 'bg-[#ffe89d]' : demand.status === 'rejected' ? 'bg-[#ffcccc]' : 'bg-[#f5f7f4]'}`}>{demand.status}</span>
                </div>
              )) : <div className="p-7 text-sm text-[#68746c]">No demands yet. Get verified to start posting what your business needs.</div>)}

              {isAdmin && <div className="p-7 text-sm text-[#68746c]">Visit the admin panel to manage users, products, demands, and reports.</div>}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-lg bg-[#101513] p-6 text-white">
              <div className="flex items-center justify-between">
                <ShieldCheck size={22} className="text-[#c8ff00]" />
                <span className="font-mono text-[10px] text-[#c8ff00]">TRUST CENTER</span>
              </div>
              <h3 className="mt-6 font-mono text-xl font-black">Rights-first by design.</h3>
              <p className="mt-2 text-sm leading-6 text-white/60">Moderated listings, verification gates, account-scoped data, and policy drafts. Payment and file delivery are not enabled yet.</p>
            </div>

            {notifications.length > 0 && (
              <div className="rounded-lg border border-[#101513]/15 bg-white p-5">
                <h3 className="flex items-center gap-2 font-mono text-sm font-black"><Bell size={16} /> Notifications</h3>
                <div className="mt-3 space-y-2">
                  {notifications.slice(0, 5).map((n) => (
                    <div key={n.id} className={`rounded p-3 text-xs ${n.read ? 'bg-[#f5f7f4]' : 'bg-[#d9eecc]'}`}>
                      <b>{n.title}</b>
                      {n.message && <p className="mt-1 text-[#68746c]">{n.message}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {isBuyer && wishlist.length > 0 && (
              <div className="rounded-lg border border-[#101513]/15 bg-white p-5">
                <h3 className="flex items-center gap-2 font-mono text-sm font-black"><Heart size={16} /> Saved products</h3>
                <div className="mt-3 space-y-2">
                  {wishlist.slice(0, 4).map((p) => (
                    <div key={p.id} className="text-xs"><b>{p.title}</b><p className="text-[#68746c]">{money(p.price)}</p></div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-10 rounded-lg border border-[#101513]/10 bg-white p-5 text-xs text-[#68746c]">
          Active workspace: <b className="capitalize text-[#101513]">{role}</b>. Role changes require an approved account-role flow.
        </div>
      </div>

      {notice && <div className="toast"><CheckCircle size={15} /> {notice}</div>}
      {showCreate && <CreateProductModal onClose={() => setShowCreate(false)} onSubmit={handleCreateProduct} />}
      {showDemand && <CreateDemandModal onClose={() => setShowDemand(false)} onSubmit={handleCreateDemand} />}
      {showRequest && <CreateProductRequestModal onClose={() => setShowRequest(false)} onSubmit={handleCreateRequest} />}
    </main>
  );
}

function FirstTenSales({ products }: { products: Product[] }) {
  const published = products.filter((p) => p.status === 'published').length;
  const totalSales = products.reduce((s, p) => s + p.sales_count, 0);
  const milestones = [
    { label: 'Complete profile', done: true },
    { label: 'Publish first product', done: published >= 1 },
    { label: 'Respond to a demand', done: products.some((product) => Boolean(product.demand_id)) },
    { label: 'Improve a product listing', done: false },
    { label: 'Share a product', done: false },
    { label: 'Get first sale', done: totalSales >= 1 },
    { label: 'Get a verified-purchase review', done: false },
    { label: 'Create a related product', done: products.length > 1 },
    { label: 'Reach 3 sales', done: totalSales >= 3 },
    { label: 'Reach 10 sales', done: totalSales >= 10 },
  ];
  const completed = milestones.filter((m) => m.done).length;

  return (
    <div className="mt-8 rounded-lg border-2 border-[#101513] bg-[#d9eecc] p-6 shadow-[5px_5px_0_#101513]">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
        <div>
          <div className="eyebrow">FIRST 10 SALES / GUIDANCE</div>
          <h2 className="mt-2 font-mono text-2xl font-black">Your next sale starts with one useful product.</h2>
          <p className="mt-2 text-sm text-[#56645a]">{completed} of {milestones.length} milestones complete. This is guidance, not a guarantee.</p>
        </div>
        <div className="grid h-20 w-20 place-items-center rounded-full border-8 border-[#101513] font-mono text-lg font-black">{completed}<span className="text-xs font-normal">/{milestones.length}</span></div>
      </div>
      <div className="mt-5 flex h-2 overflow-hidden rounded-full bg-white"><div className="bg-[#101513]" style={{ width: `${(completed / milestones.length) * 100}%` }} /></div>
      <div className="mt-4 space-y-2">
        {milestones.map((m) => (
          <div key={m.label} className="flex items-center gap-2 text-sm">
            <span className={`grid h-5 w-5 place-items-center rounded-full ${m.done ? 'bg-[#101513] text-[#c8ff00]' : 'border border-[#101513]/30'}`}>{m.done && <CheckCircle size={12} />}</span>
            <span className={m.done ? 'font-bold' : 'text-[#56645a]'}>{m.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ModalShell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <div className="flex items-center justify-between border-b border-[#101513]/10 pb-4">
          <h2 className="font-mono text-2xl font-black tracking-tight">{title}</h2>
          <button onClick={onClose} className="rounded border border-[#101513]/20 p-2"><XCircle size={16} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function CreateProductModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (data: { title: string; description: string; category: string; price: number; ip_declaration_accepted: boolean }) => void }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [ipDeclared, setIpDeclared] = useState(false);

  return (
    <ModalShell title="Create a product" onClose={onClose}>
      <p className="mt-4 text-sm text-[#657069]">Fill in the essentials. Your product enters moderation before going live.</p>
      <form className="mt-5 space-y-3" onSubmit={(e) => { e.preventDefault(); if (!ipDeclared) return; onSubmit({ title, description, category, price: parseInt(price) || 0, ip_declaration_accepted: ipDeclared }); }}>
        <label className="block text-xs font-bold">Product title<input required value={title} onChange={(e) => setTitle(e.target.value)} className="form-field mt-2" placeholder="e.g. Monsoon Motion Pack" /></label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-xs font-bold">Category<input required value={category} onChange={(e) => setCategory(e.target.value)} className="form-field mt-2" placeholder="Design, audio..." /></label>
          <label className="block text-xs font-bold">Price (INR)<input required type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="form-field mt-2" placeholder="1499" /></label>
        </div>
        <label className="block text-xs font-bold">Description<textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} className="form-field mt-2 resize-none" placeholder="What will buyers be able to make with it?" /></label>
        <label className="flex items-start gap-3 rounded border border-[#101513]/20 bg-[#f5f7f4] p-3 text-xs leading-5">
          <input type="checkbox" checked={ipDeclared} onChange={(e) => setIpDeclared(e.target.checked)} className="mt-1 accent-[#101513]" />
          I have the necessary rights and permissions to sell this content.
        </label>
        <button type="submit" disabled={!ipDeclared} className="primary-btn w-full justify-center disabled:opacity-50">Submit for moderation <ArrowRight size={15} /></button>
      </form>
    </ModalShell>
  );
}

function CreateDemandModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (data: { title: string; description: string; category: string; budget: string; deadline: string }) => void }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [budget, setBudget] = useState('');
  const [deadline, setDeadline] = useState('');
  const [confirmed, setConfirmed] = useState(false);

  return (
    <ModalShell title="Post a demand" onClose={onClose}>
      <p className="mt-4 text-sm text-[#657069]">Only verified businesses can publish public demands. Your brief will be reviewed first.</p>
      <form className="mt-5 space-y-3" onSubmit={(e) => { e.preventDefault(); if (!confirmed) return; onSubmit({ title, description, category, budget, deadline }); }}>
        <label className="block text-xs font-bold">What do you need?<input required value={title} onChange={(e) => setTitle(e.target.value)} className="form-field mt-2" placeholder="e.g. A playful Hindi learning kit" /></label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-xs font-bold">Category<input required value={category} onChange={(e) => setCategory(e.target.value)} className="form-field mt-2" placeholder="Education" /></label>
          <label className="block text-xs font-bold">Budget<input value={budget} onChange={(e) => setBudget(e.target.value)} className="form-field mt-2" placeholder="₹20,000–₹40,000" /></label>
        </div>
        <label className="block text-xs font-bold">Brief and context<textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} className="form-field mt-2 resize-none" placeholder="Tell creators what success looks like..." /></label>
        <label className="block text-xs font-bold">Deadline<input value={deadline} onChange={(e) => setDeadline(e.target.value)} className="form-field mt-2" placeholder="30 days" /></label>
        <label className="flex items-start gap-3 rounded border border-[#101513]/20 bg-[#f5f7f4] p-3 text-xs leading-5">
          <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} className="mt-1 accent-[#101513]" />
          I confirm this requirement is genuine and agree to the platform demand rules.
        </label>
        <button type="submit" disabled={!confirmed} className="primary-btn w-full justify-center disabled:opacity-50">Submit for verification <ArrowRight size={15} /></button>
      </form>
    </ModalShell>
  );
}

function CreateProductRequestModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (data: { description: string; category: string }) => void }) {
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  return (
    <ModalShell title="Request a product" onClose={onClose}>
      <p className="mt-4 text-sm text-[#657069]">Your request is private and used as an internal marketplace demand signal. Personal details are not shared with creators.</p>
      <form className="mt-5 space-y-3" onSubmit={(event) => { event.preventDefault(); onSubmit({ category, description }); }}>
        <label className="block text-xs font-bold">Category<input required maxLength={80} value={category} onChange={(event) => setCategory(event.target.value)} className="form-field mt-2" /></label>
        <label className="block text-xs font-bold">What would you like to find?<textarea required minLength={10} maxLength={2000} rows={4} value={description} onChange={(event) => setDescription(event.target.value)} className="form-field mt-2 resize-none" /></label>
        <button className="primary-btn w-full justify-center">Send product request <ArrowRight size={14} /></button>
      </form>
    </ModalShell>
  );
}
