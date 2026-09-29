import { DEMO_MODE } from '@/lib/demo-mode';
import { handleDemoRequest } from '@/lib/demo-api';

export type ApiUser = {
  id: string;
  email: string;
};

type ApiError = { message: string };
type ApiResult<T> = { data: T | null; error: ApiError | null };

async function request<T>(url: string, init?: RequestInit): Promise<ApiResult<T>> {
  if (DEMO_MODE) return handleDemoRequest(url, init) as ApiResult<T>;
  try {
    const response = await fetch(url, {
      ...init,
      credentials: 'same-origin',
      headers: { 'content-type': 'application/json', ...init?.headers },
    });
    const result = await response.json();
    if (!response.ok) return { data: null, error: { message: result.error || 'Request failed.' } };
    return { data: result as T, error: null };
  } catch (error) {
    return { data: null, error: { message: error instanceof Error ? error.message : 'Network request failed.' } };
  }
}

class DataQuery implements PromiseLike<ApiResult<unknown>> {
  private method: 'GET' | 'POST' | 'PATCH' | 'DELETE' = 'GET';
  private filters: Record<string, string> = {};
  private values: Record<string, unknown> = {};
  private orderBy = '';
  private maxRows = 100;
  private joinProducts = false;
  private singleResult = false;

  constructor(private readonly table: string) {}

  select(columns = '*') {
    this.joinProducts = columns.includes('products(*)');
    return this;
  }
  eq(field: string, value: unknown) {
    this.filters[`eq.${field === 'id' ? '_id' : field}`] = String(value);
    return this;
  }
  in(field: string, values: unknown[]) {
    this.filters[`in.${field === 'id' ? '_id' : field}`] = values.map(String).join(',');
    return this;
  }
  order(field: string, options?: { ascending?: boolean }) {
    this.orderBy = `${field}:${options?.ascending ? 'asc' : 'desc'}`;
    return this;
  }
  limit(count: number) {
    this.maxRows = count;
    return this;
  }
  insert(values: Record<string, unknown> | Record<string, unknown>[]) {
    this.method = 'POST';
    this.values = Array.isArray(values) ? values[0] : values;
    return this;
  }
  update(values: Record<string, unknown>) {
    this.method = 'PATCH';
    this.values = values;
    return this;
  }
  delete() {
    this.method = 'DELETE';
    return this;
  }
  single() {
    this.singleResult = true;
    return this.execute();
  }
  maybeSingle() {
    this.singleResult = true;
    return this.execute();
  }

  private execute(): Promise<ApiResult<unknown>> {
    if (this.method === 'GET') {
      const params = new URLSearchParams({ table: this.table, limit: String(this.maxRows) });
      Object.entries(this.filters).forEach(([key, value]) => params.set(key, value));
      if (this.orderBy) params.set('order', this.orderBy);
      if (this.joinProducts) params.set('join', 'products');
      if (this.singleResult) params.set('single', 'true');
      return request(`/api/data?${params.toString()}`);
    }
    const id = this.filters['eq._id'] || '';
    if (this.method === 'POST') return request('/api/data', { method: 'POST', body: JSON.stringify({ table: this.table, values: this.values }) });
    return request('/api/data', { method: this.method, body: JSON.stringify({ table: this.table, id, filters: this.filters, values: this.values }) });
  }

  then<TResult1 = ApiResult<unknown>, TResult2 = never>(
    onfulfilled?: ((value: ApiResult<unknown>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }
}

export const marketplaceApi = {
  checkout: {
    getConfig(productIds: string[]) {
      const params = productIds.length ? `?productIds=${encodeURIComponent(productIds.join(','))}` : '';
      return request<{ commissionBps: number; taxBps: number; paymentEnabled: boolean; products?: Product[] }>(`/api/checkout${params}`);
    },
    createOrder(input: { productIds: string[]; termsAccepted: boolean; expectedSubtotal: number; expectedPlatformFee: number; expectedTax: number }) {
      return request<{ orderId: string; paymentEnabled: boolean }>('/api/checkout', { method: 'POST', body: JSON.stringify(input) });
    },
  },
  respondToDemand(id: string, input: { title: string; category: string; description: string; price: number; ipDeclarationAccepted: boolean }) {
    return request<{ productId: string }>(`/api/demands/${encodeURIComponent(id)}/responses`, { method: 'POST', body: JSON.stringify(input) });
  },
  from(table: string) {
    return new DataQuery(table);
  },
  auth: {
    async signInWithPassword(credentials: { email: string; password: string }) {
      const result = await request<{ user: ApiUser }>('/api/auth', {
        method: 'POST',
        body: JSON.stringify({ action: 'login', ...credentials }),
      });
      if (!result.error && typeof window !== 'undefined') window.dispatchEvent(new Event('krafto-auth-changed'));
      return { data: { user: result.data?.user || null }, error: result.error ? new Error(result.error.message) : null };
    },
    async signUp(input: { email: string; password: string; options?: { data?: Record<string, unknown> } }) {
      const result = await request<{ user: ApiUser }>('/api/auth', {
        method: 'POST',
        body: JSON.stringify({ action: 'register', email: input.email, password: input.password, ...input.options?.data }),
      });
      if (!result.error && typeof window !== 'undefined') window.dispatchEvent(new Event('krafto-auth-changed'));
      return { data: { user: result.data?.user || null }, error: result.error ? new Error(result.error.message) : null };
    },
    async signOut() {
      const result = await request('/api/auth', { method: 'DELETE' });
      if (typeof window !== 'undefined') window.dispatchEvent(new Event('krafto-auth-changed'));
      return { error: result.error ? new Error(result.error.message) : null };
    },
    async getSession() {
      const result = await request<{ user: ApiUser | null }>('/api/auth');
      return { data: { session: result.data?.user ? { user: result.data.user } : null }, error: result.error };
    },
    onAuthStateChange(callback: (event: string, session: { user: ApiUser } | null) => void) {
      const update = async () => {
        const { data } = await this.getSession();
        callback('SIGNED_IN', data.session);
      };
      if (typeof window !== 'undefined') window.addEventListener('krafto-auth-changed', update);
      return { data: { subscription: { unsubscribe: () => {
        if (typeof window !== 'undefined') window.removeEventListener('krafto-auth-changed', update);
      } } } };
    },
  },
};

export type Profile = {
  id: string;
  email: string;
  display_name: string;
  role: 'buyer' | 'creator' | 'business' | 'admin';
  bio: string | null;
  avatar_url: string | null;
  skills: string[] | null;
  categories: string[] | null;
  languages: string[] | null;
  location: string | null;
  business_name: string | null;
  business_category: string | null;
  website: string | null;
  verification_status: 'pending' | 'verified' | 'rejected' | 'additional_info_required';
  creator_onboarded: boolean;
  terms_accepted: boolean;
  privacy_accepted: boolean;
  creator_terms_accepted: boolean;
  business_terms_accepted: boolean;
  suspended: boolean;
  created_at: string;
};

export type Product = {
  id: string; creator_id: string; title: string; description: string | null; category: string; price: number;
  image_url: string | null; file_format: string | null; license_type: string; language: string; tags: string[] | null;
  is_digital: boolean; status: 'draft' | 'moderation' | 'approved' | 'published' | 'rejected'; demand_id: string | null;
  rejection_reason: string | null; rating: number; sales_count: number; created_at: string; seller_name?: string;
};

export type Demand = {
  id: string; business_id: string; title: string; description: string | null; category: string; product_type: string | null;
  budget: string | null; quantity: number | null; deadline: string | null; is_digital: boolean; language: string;
  location: string | null; visibility: string; status: 'draft' | 'moderation' | 'published' | 'closed' | 'rejected';
  rejection_reason: string | null; response_count: number; created_at: string;
};

export type Order = {
  id: string; buyer_id: string; status: 'pending' | 'paid' | 'failed' | 'refunded' | 'delivered'; payment_id: string | null;
  payment_method: string | null; subtotal: number; platform_fee: number; tax: number; total: number;
  terms_accepted: boolean; terms_version: string; created_at: string;
};

export type OrderItem = {
  id: string; order_id: string; product_id: string; creator_id: string; price: number; platform_fee: number;
  product_title: string; product_category: string; creator_name: string; creator_payable: number;
  payout_status: 'pending' | 'paid' | 'refunded'; download_count: number; created_at: string;
};

export type Notification = { id: string; user_id: string; type: string; title: string; message: string | null; link: string | null; read: boolean; created_at: string };
