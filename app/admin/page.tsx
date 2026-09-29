'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Clock, ShieldCheck, XCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { marketplaceApi, Product, Demand, Profile, Order } from '@/lib/marketplace-api';
import { DEMO_MODE } from '@/lib/demo-mode';

type AdminReport = { id: string; target_type: string; target_id: string; reason: string; status: string; created_at: string };
type AdminAuditLog = { id: string; action: string; target_type: string; target_id: string; created_at: string };
type AdminProductRequest = { id: string; user_id: string; category: string; description: string; status: string };

export default function AdminPage() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [demands, setDemands] = useState<Demand[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);
  const [productRequests, setProductRequests] = useState<AdminProductRequest[]>([]);
  const [tab, setTab] = useState<'products' | 'demands' | 'users' | 'orders' | 'reports' | 'audit_logs' | 'product_requests'>('products');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (!loading && !user) router.push('/login');
    if (!loading && profile && profile.role !== 'admin') router.push('/dashboard');
  }, [user, profile, loading, router]);

  const showNotice = useCallback((msg: string) => { setNotice(msg); window.setTimeout(() => setNotice(''), 3000); }, []);

  const loadData = useCallback(async () => {
    const { data: pendingProducts, error: productError } = await marketplaceApi.from('products').select('*').in('status', ['moderation', 'draft', 'approved']).order('created_at', { ascending: false });
    if (productError) showNotice(`Could not load products: ${productError.message}`);
    setProducts((pendingProducts as Product[]) || []);
    const { data: pendingDemands, error: demandError } = await marketplaceApi.from('demands').select('*').in('status', ['moderation', 'draft']).order('created_at', { ascending: false });
    if (demandError) showNotice(`Could not load demands: ${demandError.message}`);
    setDemands((pendingDemands as Demand[]) || []);
    const { data: allProfiles, error: profileError } = await marketplaceApi.from('profiles').select('*').order('created_at', { ascending: false }).limit(20);
    if (profileError) showNotice(`Could not load accounts: ${profileError.message}`);
    setProfiles((allProfiles as Profile[]) || []);
    const { data: allOrders, error: orderError } = await marketplaceApi.from('orders').select('*').order('created_at', { ascending: false }).limit(100);
    if (orderError) showNotice(`Could not load orders: ${orderError.message}`);
    setOrders((allOrders as Order[]) || []);
    const { data: allReports, error: reportError } = await marketplaceApi.from('reports').select('*').order('created_at', { ascending: false }).limit(100);
    if (reportError) showNotice(`Could not load reports: ${reportError.message}`);
    setReports((allReports as AdminReport[]) || []);
    const { data: logs, error: auditError } = await marketplaceApi.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(100);
    if (auditError) showNotice(`Could not load audit logs: ${auditError.message}`);
    setAuditLogs((logs as AdminAuditLog[]) || []);
    const { data: requests, error: requestError } = await marketplaceApi.from('product_requests').select('*').order('created_at', { ascending: false }).limit(100);
    if (requestError) showNotice(`Could not load buyer requests: ${requestError.message}`);
    setProductRequests((requests as AdminProductRequest[]) || []);
  }, [showNotice]);

  useEffect(() => {
    if (profile?.role === 'admin') loadData();
  }, [profile, loadData]);
  const updateRecord = async (table: string, id: string, values: Record<string, unknown>, success: string) => {
    const { error } = await marketplaceApi.from(table).update(values).eq('id', id);
    if (error) {
      showNotice(`Action failed: ${error.message}`);
      return;
    }
    showNotice(success);
    await loadData();
  };

  const approveProduct = async (id: string) => {
    await updateRecord('products', id, { status: 'approved' }, 'Product approved. Review and publish it when ready.');
  };
  const publishProduct = async (id: string) => {
    await updateRecord('products', id, { status: 'published' }, 'Product published.');
  };
  const rejectProduct = async (id: string) => {
    await updateRecord('products', id, { status: 'rejected', rejection_reason: 'Policy violation' }, 'Product rejected.');
  };
  const approveDemand = async (id: string) => {
    await updateRecord('demands', id, { status: 'published' }, 'Demand approved and published.');
  };
  const rejectDemand = async (id: string) => {
    await updateRecord('demands', id, { status: 'rejected', rejection_reason: 'Does not meet guidelines' }, 'Demand rejected.');
  };
  const verifyBusiness = async (id: string) => {
    await updateRecord('profiles', id, { verification_status: 'verified' }, 'Business verified.');
  };
  const rejectBusiness = async (id: string) => {
    await updateRecord('profiles', id, { verification_status: 'rejected' }, 'Business verification rejected.');
  };
  const toggleSuspend = async (p: Profile) => {
    await updateRecord('profiles', p.id, { suspended: !p.suspended }, p.suspended ? 'User restored.' : 'User suspended.');
  };

  if (loading) return <div className="grid min-h-screen place-items-center bg-[#f5f7f4]"><div className="font-mono text-sm text-[#68746c]">Loading admin panel...</div></div>;
  if (profile?.role !== 'admin') return null;

  return (
    <main className="min-h-screen bg-[#f5f7f4] text-[#101513]">
      <header className="sticky top-0 z-30 border-b border-[#101513]/10 bg-[#f5f7f4]/95 backdrop-blur-md">
        <div className="mx-auto flex h-[70px] max-w-[1440px] items-center justify-between px-5 lg:px-10">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded bg-[#c8ff00] font-mono text-xl font-black shadow-[3px_3px_0_#101513]">K</span>
            <span className="font-mono text-sm font-black">KRAFTO</span>
            <span className="ml-2 rounded border border-[#101513]/20 px-2 py-1 font-mono text-[9px] tracking-widest text-[#64706b]">ADMIN</span>
          </Link>
          <Link href="/dashboard" className="rounded-md bg-[#101513] px-3 py-2 text-xs font-bold text-white">Back to dashboard</Link>
        </div>
      </header>

      <div className="mx-auto max-w-[1440px] px-5 pb-20 lg:px-10">
        <div className="border-b border-[#101513]/15 py-10">
          <div className="eyebrow"><span className="pulse-dot" /> ADMIN PANEL</div>
          <h1 className="mt-4 font-mono text-4xl font-black tracking-[-.06em]">Operate the marketplace.</h1>
        </div>

        <div className="mt-6 flex gap-2">
          <button onClick={() => setTab('products')} className={`filter-pill ${tab === 'products' ? 'active' : ''}`}>Products ({products.length})</button>
          <button onClick={() => setTab('demands')} className={`filter-pill ${tab === 'demands' ? 'active' : ''}`}>Demands ({demands.length})</button>
          <button onClick={() => setTab('users')} className={`filter-pill ${tab === 'users' ? 'active' : ''}`}>Users ({profiles.length})</button>
          <button onClick={() => setTab('orders')} className={`filter-pill ${tab === 'orders' ? 'active' : ''}`}>Orders ({orders.length})</button>
          <button onClick={() => setTab('reports')} className={`filter-pill ${tab === 'reports' ? 'active' : ''}`}>Reports ({reports.length})</button>
          <button onClick={() => setTab('audit_logs')} className={`filter-pill ${tab === 'audit_logs' ? 'active' : ''}`}>Audit ({auditLogs.length})</button>
          <button onClick={() => setTab('product_requests')} className={`filter-pill ${tab === 'product_requests' ? 'active' : ''}`}>Buyer requests ({productRequests.length})</button>
        </div>

        {tab === 'products' && (
          <div className="mt-6 space-y-3">
            {products.length === 0 ? <div className="rounded border border-[#101513]/15 bg-white p-7 text-sm text-[#68746c]">No products pending review.</div> :
            products.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded border border-[#101513]/15 bg-white p-4">
                <div><b className="text-sm">{p.title}</b><p className="mt-1 text-xs text-[#718078]">₹{p.price} · {p.category} · {p.status}</p></div>
                <div className="flex gap-2">
                  {p.status === 'approved' ? (
                    <button disabled={!DEMO_MODE} title={DEMO_MODE ? 'Demo-only publication; this listing cannot be purchased or downloaded.' : 'Private file storage and malware scanning are not configured.'} onClick={() => publishProduct(p.id)} className={`rounded bg-[#c8ff00] px-3 py-1.5 text-xs font-bold ${DEMO_MODE ? '' : 'opacity-50'}`}>{DEMO_MODE ? 'Publish demo listing' : 'Secure delivery required'}</button>
                  ) : (
                    <>
                      <button onClick={() => approveProduct(p.id)} className="rounded bg-[#c8ff00] px-3 py-1.5 text-xs font-bold">Approve</button>
                      <button onClick={() => rejectProduct(p.id)} className="rounded border border-red-300 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700">Reject</button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'demands' && (
          <div className="mt-6 space-y-3">
            {demands.length === 0 ? <div className="rounded border border-[#101513]/15 bg-white p-7 text-sm text-[#68746c]">No demands pending review.</div> :
            demands.map((d) => (
              <div key={d.id} className="flex items-center justify-between rounded border border-[#101513]/15 bg-white p-4">
                <div><b className="text-sm">{d.title}</b><p className="mt-1 text-xs text-[#718078]">{d.category} · {d.budget || 'TBD'} · {d.status}</p></div>
                <div className="flex gap-2">
                  <button onClick={() => approveDemand(d.id)} className="rounded bg-[#c8ff00] px-3 py-1.5 text-xs font-bold">Approve</button>
                  <button onClick={() => rejectDemand(d.id)} className="rounded border border-red-300 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700">Reject</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'users' && (
          <div className="mt-6 space-y-3">
            {profiles.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded border border-[#101513]/15 bg-white p-4">
                <div>
                  <b className="text-sm">{p.display_name}</b>
                  <p className="mt-1 text-xs text-[#718078]">{p.email} · {p.role} · {p.suspended ? 'SUSPENDED' : 'Active'}</p>
                  {p.role === 'business' && <p className="mt-1 text-xs text-[#718078]">Verification: {p.verification_status}</p>}
                </div>
                <div className="flex gap-2">
                  {p.role === 'business' && p.verification_status === 'pending' && (
                    <>
                      <button onClick={() => verifyBusiness(p.id)} className="rounded bg-[#c8ff00] px-3 py-1.5 text-xs font-bold">Verify</button>
                      <button onClick={() => rejectBusiness(p.id)} className="rounded border border-red-300 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700">Reject</button>
                    </>
                  )}

                  <button onClick={() => toggleSuspend(p)} className={`rounded border px-3 py-1.5 text-xs font-bold ${p.suspended ? 'bg-[#c8ff00] border-[#101513]' : 'border-red-300 bg-red-50 text-red-700'}`}>
                    {p.suspended ? 'Restore' : 'Suspend'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'orders' && (
          <div className="mt-6 space-y-3">
            {orders.length === 0 ? <div className="rounded border border-[#101513]/15 bg-white p-7 text-sm text-[#68746c]">No orders recorded. Payment is disabled until a verified provider integration is enabled.</div> :
            orders.map((order) => (
              <div key={order.id} className="flex items-center justify-between rounded border border-[#101513]/15 bg-white p-4">
                <div><b className="text-sm">Order {order.id.slice(0, 8)}</b><p className="mt-1 text-xs text-[#718078]">{new Date(order.created_at).toLocaleString('en-IN')} · {order.status}</p></div>
                <b className="font-mono text-sm">₹{order.total.toLocaleString('en-IN')}</b>
              </div>
            ))}
          </div>
        )}

        {tab === 'reports' && (
          <div className="mt-6 space-y-3">
            {reports.length === 0 ? <div className="rounded border border-[#101513]/15 bg-white p-7 text-sm text-[#68746c]">No reports are currently recorded.</div> :
            reports.map((report) => (
              <div key={report.id} className="flex items-center justify-between rounded border border-[#101513]/15 bg-white p-4">
                <div><b className="text-sm">{report.target_type} · {report.status}</b><p className="mt-1 text-xs text-[#718078]">{report.reason} · {report.target_id}</p></div>
                {report.status !== 'resolved' && <button onClick={() => updateRecord('reports', report.id, { status: 'resolved' }, 'Report marked resolved.')} className="rounded bg-[#c8ff00] px-3 py-1.5 text-xs font-bold">Resolve</button>}
              </div>
            ))}
          </div>
        )}

        {tab === 'audit_logs' && (
          <div className="mt-6 space-y-3">
            {auditLogs.length === 0 ? <div className="rounded border border-[#101513]/15 bg-white p-7 text-sm text-[#68746c]">No administrator actions have been recorded.</div> :
            auditLogs.map((entry) => (
              <div key={entry.id} className="rounded border border-[#101513]/15 bg-white p-4 text-xs">
                <b>{entry.action}</b><p className="mt-1 text-[#718078]">{entry.target_type} · {entry.target_id} · {new Date(entry.created_at).toLocaleString('en-IN')}</p>
              </div>
            ))}
          </div>
        )}

        {tab === 'product_requests' && (
          <div className="mt-6 space-y-3">
            {productRequests.length === 0 ? <div className="rounded border border-[#101513]/15 bg-white p-7 text-sm text-[#68746c]">No private buyer requests are recorded.</div> :
            productRequests.map((request) => (
              <div key={request.id} className="flex items-center justify-between rounded border border-[#101513]/15 bg-white p-4">
                <div><b className="text-sm">{request.category} · {request.status}</b><p className="mt-1 text-xs text-[#718078]">{request.description}</p></div>
                {request.status !== 'closed' && <button onClick={() => updateRecord('product_requests', request.id, { status: 'closed' }, 'Buyer request closed.')} className="rounded border border-[#101513]/20 px-3 py-1.5 text-xs font-bold">Close</button>}
              </div>
            ))}
          </div>
        )}
      </div>
      {notice && <div className="toast"><CheckCircle size={15} /> {notice}</div>}
    </main>
  );
}
