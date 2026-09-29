import { DEMO_MODE } from '@/lib/demo-mode';

type DemoRecord = Record<string, unknown>;
type DemoStore = {
  activeUserId: string | null;
  profiles: DemoRecord[];
  products: DemoRecord[];
  demands: DemoRecord[];
  demand_responses: DemoRecord[];
  orders: DemoRecord[];
  order_items: DemoRecord[];
  wishlists: DemoRecord[];
  notifications: DemoRecord[];
  reviews: DemoRecord[];
  reports: DemoRecord[];
  audit_logs: DemoRecord[];
  product_requests: DemoRecord[];
};

const STORE_KEY = 'krafto_demo_store_v1';
const DEMO_PASSWORD = 'KraftoDemo!2026';
const timestamp = '2026-09-01T10:00:00.000Z';

const initialStore = (): DemoStore => {
  const profiles: DemoRecord[] = [
    { id: 'demo-buyer', email: 'buyer@krafto-demo.test', display_name: 'Aarav Mehta', role: 'buyer', bio: null, avatar_url: null, skills: [], categories: [], languages: ['English', 'Hindi'], location: 'Mumbai, India', business_name: null, business_category: null, website: null, verification_status: 'pending', creator_onboarded: false, terms_accepted: true, privacy_accepted: true, age_confirmed: true, creator_terms_accepted: false, business_terms_accepted: false, suspended: false, created_at: timestamp },
    { id: 'demo-creator', email: 'creator@krafto-demo.test', display_name: 'Mira Sen', role: 'creator', bio: 'Independent designer creating practical digital tools for thoughtful brands.', avatar_url: null, skills: ['Brand identity', 'Illustration', 'Typography'], categories: ['Design', 'Fonts'], languages: ['English', 'Bengali'], location: 'Kolkata, India', business_name: null, business_category: null, website: null, verification_status: 'pending', creator_onboarded: true, terms_accepted: true, privacy_accepted: true, age_confirmed: true, creator_terms_accepted: true, business_terms_accepted: false, suspended: false, created_at: timestamp },
    { id: 'demo-business', email: 'business@krafto-demo.test', display_name: 'Studio Terra Team', role: 'business', bio: null, avatar_url: null, skills: [], categories: [], languages: ['English'], location: 'Bengaluru, India', business_name: 'Studio Terra', business_category: 'Home & lifestyle', website: 'https://example.com', verification_status: 'verified', creator_onboarded: false, terms_accepted: true, privacy_accepted: true, age_confirmed: true, creator_terms_accepted: false, business_terms_accepted: true, suspended: false, created_at: timestamp },
    { id: 'demo-pending-business', email: 'pending-business@krafto-demo.test', display_name: 'Northstar Learning Team', role: 'business', bio: null, avatar_url: null, skills: [], categories: [], languages: ['English'], location: 'Pune, India', business_name: 'Northstar Learning', business_category: 'Education', website: null, verification_status: 'pending', creator_onboarded: false, terms_accepted: true, privacy_accepted: true, age_confirmed: true, creator_terms_accepted: false, business_terms_accepted: true, suspended: false, created_at: timestamp },
    { id: 'demo-admin', email: 'admin@krafto-demo.test', display_name: 'Krafto Demo Admin', role: 'admin', bio: null, avatar_url: null, skills: [], categories: [], languages: ['English'], location: 'India', business_name: null, business_category: null, website: null, verification_status: 'pending', creator_onboarded: false, terms_accepted: true, privacy_accepted: true, age_confirmed: true, creator_terms_accepted: false, business_terms_accepted: false, suspended: false, created_at: timestamp },
  ];
  const products: DemoRecord[] = [
    { id: 'demo-product-brand-kit', creator_id: 'demo-creator', title: 'The Everyday Brand Kit', description: 'A warm, flexible visual identity starter kit for independent shops and makers.', category: 'Design', price: 1499, image_url: null, file_format: 'Figma', license_type: 'commercial', language: 'English', tags: ['branding', 'small business', 'identity'], is_digital: true, status: 'published', demand_id: null, rejection_reason: null, rating: 4.9, sales_count: 128, created_at: timestamp },
    { id: 'demo-product-fonts', creator_id: 'demo-creator', title: 'Field Notes Display Fonts', description: 'A friendly display type pairing for packaging, editorial, and campaign work.', category: 'Fonts', price: 899, image_url: null, file_format: 'OTF', license_type: 'commercial', language: 'English', tags: ['typography', 'fonts', 'editorial'], is_digital: true, status: 'published', demand_id: null, rejection_reason: null, rating: 4.8, sales_count: 84, created_at: timestamp },
    { id: 'demo-product-social', creator_id: 'demo-creator', title: 'Small Shop Social Templates', description: 'Editable layouts to help independent shops tell their story online.', category: 'Design', price: 699, image_url: null, file_format: 'Figma', license_type: 'commercial', language: 'English', tags: ['social', 'templates', 'retail'], is_digital: true, status: 'published', demand_id: null, rejection_reason: null, rating: 4.7, sales_count: 61, created_at: timestamp },
    { id: 'demo-product-audio', creator_id: 'demo-creator', title: 'Monsoon Morning Sound Pack', description: 'An original collection of gentle ambient textures for short-form projects.', category: 'Audio', price: 499, image_url: null, file_format: 'WAV', license_type: 'commercial', language: 'English', tags: ['audio', 'ambient', 'sound'], is_digital: true, status: 'published', demand_id: null, rejection_reason: null, rating: 5, sales_count: 46, created_at: timestamp },
    { id: 'demo-product-motion', creator_id: 'demo-creator', title: 'Soft Motion Title Cards', description: 'A minimal set of title-card concepts for independent filmmakers and editors.', category: 'Motion & 3D', price: 1199, image_url: null, file_format: 'MP4', license_type: 'commercial', language: 'English', tags: ['motion', 'video', 'titles'], is_digital: true, status: 'published', demand_id: null, rejection_reason: null, rating: 4.8, sales_count: 38, created_at: timestamp },
    { id: 'demo-product-moderation', creator_id: 'demo-creator', title: 'Demo listing awaiting review', description: 'A sample moderation queue entry. No downloadable asset is attached.', category: 'Design', price: 0, image_url: null, file_format: 'Figma', license_type: 'commercial', language: 'English', tags: ['demo', 'moderation'], is_digital: true, status: 'moderation', demand_id: null, rejection_reason: null, rating: 0, sales_count: 0, created_at: timestamp },
  ];
  const demands: DemoRecord[] = [
    { id: 'demo-demand-packaging', business_id: 'demo-business', title: 'Illustrated packaging for a new tea range', description: 'Looking for a distinctive, print-ready illustration direction for a small-batch Indian tea launch.', category: 'Design', product_type: 'Packaging illustration', budget: '₹15,000–₹25,000', quantity: 1, deadline: 'Flexible', is_digital: true, language: 'English', location: 'Bengaluru, India', visibility: 'public', genuine_requirement_confirmed: true, status: 'published', rejection_reason: null, response_count: 2, created_at: timestamp },
    { id: 'demo-demand-learning', business_id: 'demo-pending-business', title: 'Visual worksheets for an early-learning course', description: 'A sample brief from a business account awaiting verification. It is not publicly visible.', category: 'Design', product_type: 'Learning materials', budget: '₹8,000–₹12,000', quantity: 1, deadline: 'Flexible', is_digital: true, language: 'English', location: 'Pune, India', visibility: 'public', genuine_requirement_confirmed: true, status: 'moderation', rejection_reason: null, response_count: 0, created_at: timestamp },
  ];
  return { activeUserId: null, profiles, products, demands, demand_responses: [], orders: [], order_items: [], wishlists: [], notifications: [], reviews: [], reports: [], audit_logs: [], product_requests: [] };
};

function readStore(): DemoStore {
  const raw = window.localStorage.getItem(STORE_KEY);
  if (!raw) {
    const store = initialStore();
    writeStore(store);
    return store;
  }
  const parsed: unknown = JSON.parse(raw);
  if (!parsed || typeof parsed !== 'object' || !('profiles' in parsed) || !Array.isArray(parsed.profiles)) {
    throw new Error('Demo data is invalid. Clear this site’s local storage to reset the demo.');
  }
  return parsed as DemoStore;
}

function writeStore(store: DemoStore) {
  window.localStorage.setItem(STORE_KEY, JSON.stringify(store));
}

function currentUser(store: DemoStore) {
  return store.profiles.find((profile) => profile.id === store.activeUserId) || null;
}

function newId(prefix: string) {
  return `${prefix}-${window.crypto.randomUUID()}`;
}

function success(value: unknown) {
  return { data: value, error: null };
}

function failure(message: string) {
  return { data: null, error: { message } };
}

function filterRows(rows: DemoRecord[], params: URLSearchParams) {
  let result = rows;
  params.forEach((value, key) => {
    const field = key.startsWith('eq.') || key.startsWith('in.') ? key.slice(key.indexOf('.') + 1) : '';
    if (!field) return;
    const normalized = field === '_id' ? 'id' : field;
    if (key.startsWith('eq.')) result = result.filter((row) => String(row[normalized] ?? '') === value);
    if (key.startsWith('in.')) {
      const values = value.split(',');
      result = result.filter((row) => values.includes(String(row[normalized] ?? '')));
    }
  });
  const order = params.get('order');
  if (order) {
    const [field, direction] = order.split(':');
    result = [...result].sort((left, right) => {
      const a = String(left[field] ?? '');
      const b = String(right[field] ?? '');
      return (a.localeCompare(b)) * (direction === 'asc' ? 1 : -1);
    });
  }
  return result.slice(0, Math.min(Math.max(Number(params.get('limit')) || 100, 1), 100));
}

function bodyRecord(init?: RequestInit): DemoRecord {
  if (!init?.body || typeof init.body !== 'string') return {};
  const value: unknown = JSON.parse(init.body);
  return value && typeof value === 'object' && !Array.isArray(value) ? value as DemoRecord : {};
}

export function handleDemoRequest(url: string, init?: RequestInit) {
  try {
    const parsedUrl = new URL(url, window.location.origin);
    const method = init?.method || 'GET';
    const body = bodyRecord(init);
    const store = readStore();

    if (parsedUrl.pathname === '/api/auth') {
      if (method === 'GET') {
        const user = currentUser(store);
        return success({ user: user ? { id: user.id, email: user.email } : null });
      }
      if (method === 'DELETE') {
        store.activeUserId = null;
        writeStore(store);
        return success({ success: true });
      }
      if (method === 'POST') {
        const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
        const password = typeof body.password === 'string' ? body.password : '';
        if (password !== DEMO_PASSWORD) return failure('Use the displayed demo password for these sample accounts.');
        if (body.action === 'login') {
          const profile = store.profiles.find((entry) => entry.email === email);
          if (!profile) return failure('No demo account matches that email.');
          store.activeUserId = String(profile.id);
          writeStore(store);
          return success({ user: { id: profile.id, email: profile.email } });
        }
        if (body.action === 'register') {
          if (!['buyer', 'creator', 'business'].includes(String(body.role)) || typeof body.display_name !== 'string' || !body.display_name.trim()) {
            return failure('Choose an account type and enter your display name.');
          }
          if (body.terms_accepted !== true || body.privacy_accepted !== true || body.age_confirmed !== true) {
            return failure('Accept the required demo policies to continue.');
          }
          if (body.role === 'creator' && body.creator_terms_accepted !== true) return failure('Accept the creator agreement to continue.');
          if (body.role === 'business' && body.business_terms_accepted !== true) return failure('Accept the business terms to continue.');
          if (store.profiles.some((entry) => entry.email === email)) return failure('An account with this email already exists in this browser demo.');
          const profile: DemoRecord = {
            id: newId('demo-user'), email, display_name: body.display_name.trim(), role: body.role,
            bio: null, avatar_url: null, skills: [], categories: [], languages: [], location: body.location || null,
            business_name: body.business_name || null, business_category: body.business_category || null,
            website: body.website || null, verification_status: 'pending', creator_onboarded: body.role === 'creator',
            terms_accepted: true, privacy_accepted: true, age_confirmed: true,
            creator_terms_accepted: body.role === 'creator', business_terms_accepted: body.role === 'business',
            suspended: false, created_at: new Date().toISOString(),
          };
          store.profiles.push(profile);
          store.activeUserId = String(profile.id);
          writeStore(store);
          return success({ user: { id: profile.id, email: profile.email } });
        }
        return failure('Unsupported authentication action.');
      }
    }

    if (parsedUrl.pathname === '/api/checkout') {
      if (method === 'GET') {
        const ids = parsedUrl.searchParams.get('productIds')?.split(',').filter(Boolean) || [];
        return success({
          commissionBps: 500,
          taxBps: 0,
          paymentEnabled: false,
          products: ids.map((id) => store.products.find((product) => product.id === id && product.status === 'published'))
            .filter((product): product is DemoRecord => Boolean(product))
            .map((product) => ({
              id: product.id, title: product.title, price: product.price, category: product.category,
              seller_name: store.profiles.find((profile) => profile.id === product.creator_id)?.display_name || 'Independent creator',
            })),
        });
      }
      if (method === 'POST') {
        const buyer = currentUser(store);
        if (!buyer || !['buyer', 'business'].includes(String(buyer.role))) return failure('Sign in with a buyer or business demo account to continue.');
        if (body.termsAccepted !== true || !Array.isArray(body.productIds) || body.productIds.length === 0) return failure('Accept the purchase terms and add products to continue.');
        const items = body.productIds.map((id) => store.products.find((product) => product.id === id && product.status === 'published'));
        if (items.some((product) => !product)) return failure('One or more products are no longer available.');
        const products = items as DemoRecord[];
        if (products.some((product) => product.creator_id === buyer.id)) return failure('You cannot purchase your own product.');
        const subtotal = products.reduce((sum, product) => sum + Number(product.price), 0);
        const platformFee = Math.round(subtotal * 500 / 10000);
        const tax = 0;
        if (body.expectedSubtotal !== subtotal || body.expectedPlatformFee !== platformFee || body.expectedTax !== tax) return failure('Prices or fees changed. Refresh checkout to review the updated total.');
        const orderId = newId('demo-order');
        const date = new Date().toISOString();
        store.orders.push({ id: orderId, buyer_id: buyer.id, status: 'pending', payment_id: null, payment_method: null, subtotal, platform_fee: platformFee, tax, total: subtotal + platformFee + tax, terms_accepted: true, terms_version: 'demo-1.0', created_at: date });
        for (const product of products) {
          const fee = Math.round(Number(product.price) * 500 / 10000);
          const creator = store.profiles.find((profile) => profile.id === product.creator_id);
          store.order_items.push({
            id: newId('demo-item'), order_id: orderId, product_id: product.id, creator_id: product.creator_id,
            product_title: product.title, product_category: product.category, creator_name: creator?.display_name || 'Creator',
            price: product.price, platform_fee: fee, creator_payable: Number(product.price) - fee,
            payout_status: 'pending', download_count: 0, created_at: date,
          });
        }
        writeStore(store);
        return success({ orderId, paymentEnabled: false, subtotal, platformFee, tax, total: subtotal + platformFee + tax });
      }
    }

    const responsePath = parsedUrl.pathname.match(/^\/api\/demands\/([^/]+)\/responses$/);
    if (responsePath && method === 'POST') {
      const user = currentUser(store);
      const demand = store.demands.find((entry) => entry.id === responsePath[1] && entry.status === 'published');
      if (!user || user.role !== 'creator' || user.creator_terms_accepted !== true) return failure('Sign in with an onboarded creator demo account.');
      if (!demand) return failure('This demand is no longer available.');
      if (store.demand_responses.some((entry) => entry.demand_id === demand.id && entry.creator_id === user.id)) return failure('You have already responded to this demand.');
      if (typeof body.title !== 'string' || !body.title.trim() || typeof body.category !== 'string' || !Number.isInteger(body.price) || body.ipDeclarationAccepted !== true) {
        return failure('Complete the product details and rights declaration.');
      }
      const productId = newId('demo-product');
      const date = new Date().toISOString();
      store.products.push({
        id: productId, creator_id: user.id, title: body.title.trim(), description: body.description || '',
        category: body.category, price: body.price, image_url: null, file_format: 'Digital', license_type: 'commercial',
        language: 'English', tags: [], is_digital: true, status: 'moderation', demand_id: demand.id,
        ip_declaration_accepted: true, rejection_reason: null, rating: 0, sales_count: 0, created_at: date,
      });
      store.demand_responses.push({ id: newId('demo-response'), demand_id: demand.id, creator_id: user.id, product_id: productId, status: 'submitted', created_at: date });
      demand.response_count = Number(demand.response_count || 0) + 1;
      writeStore(store);
      return success({ productId });
    }

    if (parsedUrl.pathname === '/api/data') {
      const user = currentUser(store);
      const table = method === 'GET' ? parsedUrl.searchParams.get('table') : String(body.table || '');
      if (!table || !(table in store)) return failure('Unknown demo collection.');
      const tableName = table as keyof Omit<DemoStore, 'activeUserId'>;
      if (method === 'GET') {
        let rows = store[tableName];
        if (table === 'profiles') rows = user?.role === 'admin' ? rows : rows.filter((profile) => profile.id === user?.id);
        if (table === 'products') rows = rows.filter((product) => product.status === 'published' || product.creator_id === user?.id || user?.role === 'admin');
        if (table === 'demands') rows = rows.filter((demand) => (demand.status === 'published' && demand.visibility === 'public') || demand.business_id === user?.id || user?.role === 'admin');
        if (table === 'orders') rows = rows.filter((order) => order.buyer_id === user?.id || user?.role === 'admin');
        if (table === 'order_items' && user?.role !== 'admin') {
          const orderIds = store.orders.filter((order) => order.buyer_id === user?.id).map((order) => order.id);
          rows = rows.filter((item) => orderIds.includes(String(item.order_id)));
        }
        if (table === 'wishlists' || table === 'notifications') rows = rows.filter((row) => row.user_id === user?.id);
        if (table === 'demand_responses') rows = rows.filter((row) => row.creator_id === user?.id || store.demands.some((demand) => demand.id === row.demand_id && demand.business_id === user?.id) || user?.role === 'admin');
        if (table === 'product_requests') rows = rows.filter((row) => row.user_id === user?.id || user?.role === 'admin');
        if (table === 'reports') rows = rows.filter((row) => row.reporter_id === user?.id || user?.role === 'admin');
        if (table === 'audit_logs' && user?.role !== 'admin') return failure('Admin access required.');
        if (table === 'wishlists' && parsedUrl.searchParams.get('join') === 'products') {
          rows = rows.map((row) => ({ ...row, products: store.products.find((product) => product.id === row.product_id) || null }));
        }
        const result = filterRows(rows, parsedUrl.searchParams);
        return success(parsedUrl.searchParams.get('single') === 'true' ? result[0] || null : result);
      }
      if (!user) return failure('Sign in to continue.');
      if (method === 'POST') {
        const input = body.values as DemoRecord;
        const id = newId(`demo-${table}`);
        const date = new Date().toISOString();
        let row: DemoRecord = { ...input, id, created_at: date };
        if (table === 'products') {
          if (user.role !== 'creator' || user.creator_terms_accepted !== true || input.ip_declaration_accepted !== true) return failure('Use an onboarded creator account and accept the rights declaration.');
          row = { ...row, creator_id: user.id, status: 'moderation', is_digital: true, rating: 0, sales_count: 0, rejection_reason: null };
        } else if (table === 'demands') {
          if (user.role !== 'business' || user.verification_status !== 'verified' || input.genuine_requirement_confirmed !== true) return failure('Only verified business demo accounts can submit a demand.');
          row = { ...row, business_id: user.id, status: 'moderation', response_count: 0 };
        } else if (table === 'wishlists') {
          if (!store.products.some((product) => product.id === input.product_id && product.status === 'published')) return failure('Only published sample products can be saved.');
          if (store.wishlists.some((entry) => entry.user_id === user.id && entry.product_id === input.product_id)) return failure('This sample product is already saved.');
          row = { ...row, user_id: user.id };
        } else if (table === 'product_requests') {
          row = { ...row, user_id: user.id, status: 'open' };
        } else if (table === 'reports') {
          row = { ...row, reporter_id: user.id, status: 'open' };
        } else {
          return failure('This demo collection cannot be created.');
        }
        store[tableName].push(row);
        writeStore(store);
        return success(row);
      }
      const id = String(body.id || '');
      const target = store[tableName].find((row) => row.id === id);
      if (method === 'DELETE') {
        if (table !== 'wishlists') return failure('This demo record cannot be deleted.');
        store.wishlists = store.wishlists.filter((row) => !(row.user_id === user.id && Object.entries(body.filters as DemoRecord || {}).filter(([key]) => key.startsWith('eq.')).every(([key, value]) => row[key.slice(3)] === value)));
        writeStore(store);
        return success({ success: true });
      }
      if (method === 'PATCH') {
        if (!target) return failure('Demo record not found.');
        const updates = body.values as DemoRecord;
        if (table === 'profiles') {
          if (user.role !== 'admin' && target.id !== user.id) return failure('This profile is not accessible.');
          const allowed = user.role === 'admin' ? ['verification_status', 'suspended'] : ['display_name', 'bio', 'avatar_url', 'skills', 'categories', 'languages', 'location', 'website'];
          for (const key of allowed) if (key in updates) target[key] = updates[key];
        } else if (user.role === 'admin') {
          if (table === 'products' && updates.status === 'published' && target.status !== 'approved') {
            return failure('Approve the demo product before publishing it.');
          }
          if (table === 'demands' && updates.status === 'published') {
            const business = store.profiles.find((profile) => profile.id === target.business_id);
            if (target.status !== 'moderation' || business?.verification_status !== 'verified' || business.business_terms_accepted !== true) {
              return failure('Only a verified business demo demand can be published.');
            }
          }
          for (const key of ['status', 'rejection_reason']) if (key in updates) target[key] = updates[key];
          store.audit_logs.unshift({ id: newId('demo-audit'), admin_id: user.id, action: 'record_updated', target_type: table, target_id: id, created_at: new Date().toISOString() });
        } else if (table === 'products' && target.creator_id === user.id && ['draft', 'rejected'].includes(String(updates.status))) {
          target.status = updates.status;
        } else {
          return failure('This demo update is not permitted.');
        }
        writeStore(store);
        return success(target);
      }
    }

    return failure(`Demo mode does not support ${method} ${parsedUrl.pathname}.`);
  } catch (error) {
    return failure(error instanceof Error ? error.message : 'Demo request failed.');
  }
}

export function resetDemoData() {
  if (!DEMO_MODE || typeof window === 'undefined') return;
  writeStore(initialStore());
  window.dispatchEvent(new Event('krafto-auth-changed'));
}
