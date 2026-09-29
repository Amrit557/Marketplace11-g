'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronDown, Filter, Heart, Package, Search, ShoppingBag, Star, XCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { marketplaceApi, Product } from '@/lib/marketplace-api';

const categories = ['All work', 'Design', 'Motion & 3D', 'Audio', 'Photography', 'Business', 'Fonts'];
const money = (v: number) => `₹${v.toLocaleString('en-IN')}`;

const accentMap: Record<string, string> = {
  Design: 'citrus', 'Motion & 3D': 'sunset', Audio: 'violet', Photography: 'forest', Business: 'coral', Fonts: 'aqua',
};

export default function ExplorePage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [filtered, setFiltered] = useState<Product[]>([]);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All work');
  const [loading, setLoading] = useState(true);
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [selected, setSelected] = useState<Product | null>(null);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    let result = products;
    if (category !== 'All work') result = result.filter((p) => p.category === category);
    if (query) result = result.filter((p) => `${p.title} ${p.description ?? ''} ${p.category}`.toLowerCase().includes(query.toLowerCase()));
    setFiltered(result);
  }, [products, category, query]);

  const loadProducts = async () => {
    const { data, error } = await marketplaceApi.from('products').select('*').eq('status', 'published').order('created_at', { ascending: false });
    if (error) setNotice(`Marketplace could not load: ${error.message}`);
    setProducts((data as Product[]) || []);
    setFiltered((data as Product[]) || []);
    setLoading(false);
  };

  const loadWishlist = useCallback(async () => {
    if (!user) return;
    const { data, error } = await marketplaceApi.from('wishlists').select('product_id').eq('user_id', user.id);
    if (error) setNotice(`Saved products could not load: ${error.message}`);
    setWishlistIds(((data as { product_id: string }[] | null) || []).map((w) => w.product_id));
  }, [user]);

  useEffect(() => {
    if (user) loadWishlist();
  }, [user, loadWishlist]);

  const toggleWishlist = async (productId: string) => {
    if (!user) return;
    if (wishlistIds.includes(productId)) {
      const { error } = await marketplaceApi.from('wishlists').delete().eq('user_id', user.id).eq('product_id', productId);
      if (error) {
        setNotice(`Could not remove saved product: ${error.message}`);
        return;
      }
      setWishlistIds(wishlistIds.filter((id) => id !== productId));
    } else {
      const { error } = await marketplaceApi.from('wishlists').insert({ user_id: user.id, product_id: productId });
      if (error) {
        setNotice(`Could not save product: ${error.message}`);
        return;
      }
      setWishlistIds([...wishlistIds, productId]);
    }
  };

  const addToCart = (product: Product) => {
    let cart: Product[];
    try {
      const saved: unknown = JSON.parse(localStorage.getItem('krafto_cart') || '[]');
      cart = Array.isArray(saved) ? saved.filter((item): item is Product => Boolean(item && typeof item.id === 'string')) : [];
    } catch (error) {
      console.error('Unable to parse saved cart.', error);
      cart = [];
    }
    if (!cart.find((p: Product) => p.id === product.id)) {
      cart.push(product);
      localStorage.setItem('krafto_cart', JSON.stringify(cart));
      setNotice(`${product.title} added to cart`);
      window.setTimeout(() => setNotice(''), 2500);
    }
    setSelected(null);
  };

  if (loading) return <div className="grid min-h-screen place-items-center bg-[#f5f7f4]"><div className="font-mono text-sm text-[#68746c]">Loading marketplace...</div></div>;

  return (
    <main className="min-h-screen bg-[#f5f7f4] text-[#101513]">
      <header className="sticky top-0 z-30 border-b border-[#101513]/10 bg-[#f5f7f4]/95 backdrop-blur-md">
        <div className="mx-auto flex h-[70px] max-w-[1440px] items-center justify-between px-5 lg:px-10">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded bg-[#c8ff00] font-mono text-xl font-black shadow-[3px_3px_0_#101513]">K</span>
            <span className="font-mono text-sm font-black">KRAFTO</span>
          </Link>
          <nav className="hidden items-center gap-7 text-xs font-semibold lg:flex">
            <Link href="/explore" className="nav-active">Explore</Link>
            <Link href="/demands">Demand board</Link>
            <Link href="/dashboard">My space</Link>
          </nav>
          <Link href="/checkout" className="rounded-md bg-[#101513] px-3 py-2 text-xs font-bold text-white flex items-center gap-1.5"><ShoppingBag size={14} /> Cart</Link>
        </div>
      </header>

      <div className="mx-auto max-w-[1440px] px-5 pb-16 lg:px-10">
        <section className="py-12">
          <div className="eyebrow">MARKETPLACE / ALL WORK</div>
          <div className="mt-4 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <h1 className="font-mono text-5xl font-black tracking-[-.07em]">Find your next good thing.</h1>
              <p className="mt-3 text-sm text-[#69736d]">Original products from independent creators across India.</p>
            </div>
            <div className="flex items-center gap-2 rounded border border-[#101513]/20 bg-white px-3 py-2.5 lg:w-[300px]">
              <Search size={16} className="text-[#7a857d]" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search work, creators..." className="w-full bg-transparent text-sm outline-none" />
            </div>
          </div>
          <div className="mt-9 flex gap-2 overflow-x-auto pb-2">
            {categories.map((item) => (
              <button key={item} onClick={() => setCategory(item)} className={`filter-pill ${category === item ? 'active' : ''}`}>{item}</button>
            ))}
            <button className="filter-pill ml-auto"><Filter size={13} /> Filters</button>
          </div>
          <div className="mt-5 flex items-center justify-between border-y border-[#101513]/10 py-3 font-mono text-[10px] uppercase tracking-widest text-[#738078]">
            <span>{filtered.length} products found</span>
            <span>Sort: <b className="text-[#101513]">Recommended</b> <ChevronDown className="inline" size={13} /></span>
          </div>

          {filtered.length > 0 ? (
            <div className="product-grid mt-7">
              {filtered.map((product) => (
                <ProductCard key={product.id} product={product} saved={wishlistIds.includes(product.id)} onSave={() => toggleWishlist(product.id)} onOpen={() => setSelected(product)} accent={accentMap[product.category] || 'citrus'} />
              ))}
            </div>
          ) : (
            <div className="py-20 text-center">
              <Package className="mx-auto text-[#68746c]" />
              <p className="mt-3 font-mono font-bold">{notice.startsWith('Marketplace could not load') ? 'Marketplace is temporarily unavailable.' : 'No products found yet.'}</p>
              <p className="mt-1 text-sm text-[#68746c]">Be the first to publish — switch to creator mode and create a product.</p>
            </div>
          )}
        </section>
      </div>

      {notice && <div className="toast"><ShoppingBag size={15} /> {notice}</div>}
      {selected && <ProductModal product={selected} accent={accentMap[selected.category] || 'citrus'} onClose={() => setSelected(null)} onAdd={() => addToCart(selected)} />}
    </main>
  );
}

function ProductCard({ product, saved, onSave, onOpen, accent }: { product: Product; saved: boolean; onSave: () => void; onOpen: () => void; accent: string }) {
  return (
    <article className="product-card">
      <div className={`product-art ${accent}`} onClick={onOpen}>
        <span className="art-tag">{product.category.toUpperCase()}</span>
        <span className="art-number">{product.sales_count} sales</span>
        <div className="art-shape" />
        <div className="art-label">{product.file_format || product.category}<br /><b>{product.license_type} license</b></div>
      </div>
      <div className="flex items-start justify-between pt-3">
        <div>
          <h3 className="font-mono text-sm font-black tracking-tight">{product.title}</h3>
          <p className="mt-1 text-xs text-[#67726b]">{product.description?.slice(0, 50) ?? ''}</p>
        </div>
        <button className={`heart ${saved ? 'saved' : ''}`} onClick={onSave}><Heart size={15} fill={saved ? 'currentColor' : 'none'} /></button>
      </div>
      <div className="mt-3 flex items-center justify-between font-mono text-[10px] text-[#66726b]">
        <span><Star className="mr-1 inline text-[#879d00]" size={12} fill="currentColor" />{product.rating || 'New'}</span>
        <b className="text-sm text-[#101513]">{money(product.price)}</b>
      </div>
    </article>
  );
}

function ProductModal({ product, accent, onClose, onAdd }: { product: Product; accent: string; onClose: () => void; onAdd: () => void }) {
  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <div className="flex items-center justify-between border-b border-[#101513]/10 pb-4">
          <h2 className="font-mono text-2xl font-black tracking-tight">{product.title}</h2>
          <button onClick={onClose} className="rounded border border-[#101513]/20 p-2"><XCircle size={16} /></button>
        </div>
        <div className={`product-art mt-5 h-52 ${accent}`}>
          <span className="art-tag">{product.category.toUpperCase()}</span>
          <div className="art-shape" />
          <div className="art-label">{product.file_format || product.category}<br /><b>{product.license_type} license</b></div>
        </div>
        <div className="mt-5 flex items-start justify-between">
          <div>
            <p className="text-sm text-[#667269]">{product.description}</p>
            <div className="mt-2 font-mono text-xs"><Star className="mr-1 inline text-[#879d00]" size={13} fill="currentColor" /> {product.rating || 'New'} · {product.sales_count} sales</div>
          </div>
          <b className="font-mono text-2xl">{money(product.price)}</b>
        </div>
        <button className="primary-btn mt-6 w-full justify-center" onClick={onAdd}>Add to cart <ShoppingBag size={15} /></button>
        <p className="mt-3 text-center font-mono text-[9px] uppercase tracking-widest text-[#78837b]">Digital listing · payment and delivery are not enabled</p>
      </div>
    </div>
  );
}
