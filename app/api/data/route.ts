import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/db';
import { collectionModels, models, User } from '@/lib/models';
import { getCurrentUser } from '@/lib/server-auth';
import { DEMO_MODE } from '@/lib/demo-mode';

export const runtime = 'nodejs';

const profileEdits = ['display_name', 'bio', 'avatar_url', 'skills', 'categories', 'languages', 'location', 'website'];
function isValidWebsite(value: unknown) {
  if (typeof value !== 'string' || !value.trim()) return true;
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password;
  } catch {
    return false;
  }
}
function dataError(error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message : fallback;
  const duplicate = error instanceof Error && 'code' in error && error.code === 11000;
  const invalid = error instanceof SyntaxError || error instanceof mongoose.Error.ValidationError || error instanceof mongoose.Error.CastError;
  return NextResponse.json({ error: message }, { status: duplicate ? 409 : invalid ? 400 : 503 });
}

function filtersFrom(url: URL) {
  const filters: Record<string, unknown>[] = [];
  let invalidField = false;
  url.searchParams.forEach((value, key) => {
    if (key.startsWith('eq.')) {
      const field = key.slice(3);
      if (!/^[a-z][a-z0-9_]*$/i.test(field)) {
        invalidField = true;
        return;
      }
      filters.push({ [field === 'id' ? '_id' : field]: value });
    }
    if (key.startsWith('in.')) {
      const field = key.slice(3);
      if (!/^[a-z][a-z0-9_]*$/i.test(field)) {
        invalidField = true;
        return;
      }
      filters.push({ [field === 'id' ? '_id' : field]: { $in: value.split(',') } });
    }
  });
  if (invalidField) throw new SyntaxError('Invalid query field.');
  return filters;
}

function serialize(document: Record<string, unknown>) {
  const result: Record<string, unknown> = { ...document };
  const id = result._id;
  delete result._id;
  delete result.__v;
  delete result.password_hash;
  delete result.file_url;
  result.id = id ? String(id) : result.id;
  if (result.created_at instanceof Date) result.created_at = result.created_at.toISOString();
  if (result.updated_at instanceof Date) result.updated_at = result.updated_at.toISOString();
  return result;
}

async function authorize(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return { user: null, response: NextResponse.json({ error: 'Sign in to continue.' }, { status: 401 }) };
  if (request.method !== 'GET' && request.headers.get('origin') && request.headers.get('origin') !== request.nextUrl.origin) {
    return { user: null, response: NextResponse.json({ error: 'Cross-origin request rejected.' }, { status: 403 }) };
  }
  return { user, response: null };
}

export async function GET(request: NextRequest) {
  if (DEMO_MODE) return NextResponse.json({ error: 'The backend API is disabled in display demo mode.' }, { status: 503 });
  try {
    await connectToDatabase();
    const table = request.nextUrl.searchParams.get('table') || '';
    const Model = collectionModels[table];
    if (!Model) return NextResponse.json({ error: 'Unknown collection.' }, { status: 404 });
    const { user } = await authorize(request);
    if (request.nextUrl.searchParams.size > 20) return NextResponse.json({ error: 'Too many query filters.' }, { status: 400 });
    const filters = filtersFrom(request.nextUrl);
    const admin = user?.role === 'admin';

    if (table === 'products') {
      filters.push({ $or: [{ status: 'published' }, ...(user?.role === 'creator' ? [{ creator_id: user._id }] : []), ...(admin ? [{}] : [])] });
    } else if (table === 'demands') {
      const verifiedBusinesses = await User.find({ role: 'business', verification_status: 'verified', business_terms_accepted: true }).select('_id').lean();
      filters.push({ $or: [
        { status: 'published', visibility: 'public', business_id: { $in: verifiedBusinesses.map((business) => business._id) } },
        ...(user?.role === 'business' ? [{ business_id: user._id }] : []),
        ...(admin ? [{}] : []),
      ] });
    } else if (table === 'reviews') {
      filters.push({ status: { $ne: 'removed' } });
    } else if (table === 'profiles') {
      if (admin) {
        // Admins may review account and verification status; secret payout fields are excluded below.
      } else if (user) filters.push({ _id: user._id });
      else return NextResponse.json({ error: 'Sign in to view profiles.' }, { status: 401 });
    } else {
      if (!user) return NextResponse.json({ error: 'Sign in to view this collection.' }, { status: 401 });
      if (!admin) {
        if (table === 'orders') filters.push({ buyer_id: user._id });
        else if (table === 'order_items') {
          const orders = await collectionModels.orders.find({ buyer_id: user._id }).select('_id').lean();
          filters.push({ order_id: { $in: orders.map((order) => order._id) } });
        } else if (table === 'wishlists' || table === 'notifications') filters.push({ user_id: user._id });
        else if (table === 'demand_responses') {
          if (user.role === 'creator') filters.push({ creator_id: user._id });
          else if (user.role === 'business') {
            const demands = await collectionModels.demands.find({ business_id: user._id }).select('_id').lean();
            filters.push({ demand_id: { $in: demands.map((demand) => demand._id) } });
          } else return NextResponse.json({ error: 'Access to demand responses is not permitted.' }, { status: 403 });
        }
        else if (table === 'product_requests' && user.role === 'buyer') filters.push({ user_id: user._id });
        else if (table === 'product_requests') return NextResponse.json({ error: 'Access to product requests is not permitted.' }, { status: 403 });
        else if (table === 'reports') filters.push({ reporter_id: user._id });
        else if (table === 'audit_logs') return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
        else if (!['orders', 'order_items', 'wishlists', 'notifications', 'demand_responses', 'reports', 'product_requests'].includes(table)) return NextResponse.json({ error: 'Access to this collection is not permitted.' }, { status: 403 });
      }
    }

    const query = filters.length ? { $and: filters } : {};
    let cursor = Model.find(query);
    const order = request.nextUrl.searchParams.get('order');
    if (order) {
      const [field, direction] = order.split(':');
      if (/^[a-z][a-z0-9_]*$/i.test(field)) cursor = cursor.sort({ [field]: direction === 'asc' ? 1 : -1 });
    }
    const limit = Math.min(Math.max(Number(request.nextUrl.searchParams.get('limit')) || 100, 1), 100);
    const rows = await cursor.limit(limit).lean();
    let result = rows.map((row) => serialize(row as Record<string, unknown>));
    if (table === 'wishlists' && request.nextUrl.searchParams.get('join') === 'products') {
      result = await Promise.all(result.map(async (row) => {
        const product = mongoose.isValidObjectId(row.product_id)
          ? await collectionModels.products.findById(row.product_id).lean()
          : null;
        return { ...row, products: product ? serialize(product as Record<string, unknown>) : null };
      }));
    }
    if (request.nextUrl.searchParams.get('single') === 'true') return NextResponse.json(result[0] || null);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to read marketplace data.' }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  if (DEMO_MODE) return NextResponse.json({ error: 'The backend API is disabled in display demo mode.' }, { status: 503 });
  try {
    const { user, response } = await authorize(request);
    if (response) return response;
    await connectToDatabase();
    const body = await request.json();
    const table = body.table as string;
    const input = body.values as Record<string, unknown>;
    const Model = collectionModels[table];
    if (!Model || !input || typeof input !== 'object' || Array.isArray(input)) return NextResponse.json({ error: 'Invalid collection or record.' }, { status: 400 });

    if (table === 'products') {
      if (user.role !== 'creator') return NextResponse.json({ error: 'Creator accounts can submit products.' }, { status: 403 });
      if (!user.creator_terms_accepted) return NextResponse.json({ error: 'Accept the creator agreement before listing products.' }, { status: 403 });
      if (input.ip_declaration_accepted !== true) return NextResponse.json({ error: 'Confirm you have the rights to sell this content.' }, { status: 400 });
      Object.assign(input, { creator_id: user._id, status: 'moderation' });
    } else if (table === 'demands') {
      if (user.role !== 'business' || user.verification_status !== 'verified') return NextResponse.json({ error: 'Only verified businesses can publish demands.' }, { status: 403 });
      if (!user.business_terms_accepted || input.genuine_requirement_confirmed !== true) return NextResponse.json({ error: 'Accept the business terms and confirm the requirement is genuine.' }, { status: 400 });
      Object.assign(input, { business_id: user._id, status: 'moderation' });
    } else if (table === 'wishlists') {
      const product = await collectionModels.products.findOne({ _id: input.product_id, status: 'published' });
      if (!product) return NextResponse.json({ error: 'Only published products can be saved.' }, { status: 404 });
      Object.assign(input, { user_id: user._id });
    } else if (table === 'reports') {
      const targetTypes: Record<string, string> = { product: 'products', demand: 'demands', review: 'reviews' };
      const targetTable = targetTypes[String(input.target_type)];
      const reason = typeof input.reason === 'string' ? input.reason.trim() : '';
      if (!targetTable || !mongoose.isValidObjectId(input.target_id) || reason.length < 10 || reason.length > 2000) {
        return NextResponse.json({ error: 'Provide a valid report target and a reason between 10 and 2000 characters.' }, { status: 400 });
      }
      const target = await collectionModels[targetTable].findById(input.target_id);
      if (!target) return NextResponse.json({ error: 'The reported item was not found.' }, { status: 404 });
      Object.assign(input, { reporter_id: user._id, reason, status: 'open' });
    } else if (table === 'product_requests') {
      if (user.role !== 'buyer') return NextResponse.json({ error: 'Product requests are available to buyer accounts.' }, { status: 403 });
      const description = typeof input.description === 'string' ? input.description.trim() : '';
      const category = typeof input.category === 'string' ? input.category.trim() : '';
      if (description.length < 10 || description.length > 2000 || !category || category.length > 80) {
        return NextResponse.json({ error: 'Add a category and a request between 10 and 2000 characters.' }, { status: 400 });
      }
      Object.assign(input, { user_id: user._id, description, category, status: 'open' });
    } else if (table === 'demand_responses') {
      return NextResponse.json({ error: 'Submit demand responses through the linked product workflow.' }, { status: 403 });
    } else if (table === 'reviews') {
      if (input.buyer_id && String(input.buyer_id) !== user._id.toString()) return NextResponse.json({ error: 'Invalid reviewer.' }, { status: 403 });
      const order = await collectionModels.orders.findOne({ _id: input.order_id, buyer_id: user._id, status: { $in: ['paid', 'delivered'] } });
      if (!order) return NextResponse.json({ error: 'A completed purchase is required to review this product.' }, { status: 403 });
      const item = await collectionModels.order_items.findOne({ order_id: order._id, product_id: input.product_id });
      if (!item || String(item.get('creator_id')) === user._id.toString()) return NextResponse.json({ error: 'This purchase cannot be reviewed.' }, { status: 403 });
      input.buyer_id = user._id;
    } else {
      return NextResponse.json({ error: 'This collection cannot be created through this endpoint.' }, { status: 403 });
    }
    const document = await Model.create(input);
    return NextResponse.json(serialize(document.toObject() as Record<string, unknown>), { status: 201 });
  } catch (error) {
    return dataError(error, 'Unable to save record.');
  }
}

async function mutate(request: NextRequest, method: 'PATCH' | 'DELETE') {
  if (DEMO_MODE) return NextResponse.json({ error: 'The backend API is disabled in display demo mode.' }, { status: 503 });
  try {
    const { user, response } = await authorize(request);
    if (response) return response;
    await connectToDatabase();
    const body = await request.json();
    const Model = collectionModels[body.table as string];
    if (!Model || !mongoose.isValidObjectId(body.id)) return NextResponse.json({ error: 'Invalid collection or record ID.' }, { status: 400 });
    let filter: Record<string, unknown> = { _id: body.id };
    if (body.table === 'wishlists' && method === 'DELETE') {
      filter = { user_id: user._id };
      for (const [key, value] of Object.entries(body.filters || {})) {
        if (key.startsWith('eq.') && key !== 'eq.user_id') filter[key.slice(3)] = value;
      }
    }
    else if (body.table === 'products' && user.role === 'creator') filter.creator_id = user._id;
    else if (body.table === 'demands' && user.role === 'business') filter.business_id = user._id;
    else if (body.table === 'profiles' && user.role !== 'admin') filter._id = user._id;
    else if (user.role !== 'admin' && method !== 'DELETE') return NextResponse.json({ error: 'This update is not permitted.' }, { status: 403 });

    if (method === 'DELETE') {
      if (body.table !== 'wishlists') return NextResponse.json({ error: 'This record cannot be deleted through this endpoint.' }, { status: 403 });
      await Model.deleteMany(filter);
      return NextResponse.json({ success: true });
    }

    const updates = body.values as Record<string, unknown>;
    if (!updates || typeof updates !== 'object') return NextResponse.json({ error: 'Invalid update.' }, { status: 400 });
    let safeUpdates: Record<string, unknown> = {};
    if (body.table === 'profiles' && user.role !== 'admin') {
      for (const key of profileEdits) if (key in updates) safeUpdates[key] = updates[key];
    } else if (user.role === 'admin') {
      const allowed = body.table === 'profiles' ? ['verification_status', 'suspended'] : body.table === 'products' ? ['status', 'rejection_reason'] : body.table === 'demands' ? ['status', 'rejection_reason'] : body.table === 'reports' || body.table === 'reviews' || body.table === 'product_requests' ? ['status'] : [];
      for (const key of allowed) if (key in updates) safeUpdates[key] = updates[key];
    } else if (body.table === 'products') {
      if (!['draft', 'rejected'].includes(String(updates.status))) return NextResponse.json({ error: 'Products cannot be published without moderation.' }, { status: 403 });
      safeUpdates = { status: updates.status };
    } else {
      return NextResponse.json({ error: 'This update is not permitted.' }, { status: 403 });
    }
    if (body.table === 'profiles' && 'website' in safeUpdates && !isValidWebsite(safeUpdates.website)) {
      return NextResponse.json({ error: 'Enter a valid http or https website URL.' }, { status: 400 });
    }
    if (!Object.keys(safeUpdates).length) return NextResponse.json({ error: 'No editable fields were provided.' }, { status: 400 });
    if (body.table === 'products' && user.role === 'admin' && 'status' in safeUpdates) {
      const currentProduct = await Model.findById(body.id);
      if (!currentProduct) return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
      const currentStatus = String(currentProduct.get('status'));
      const nextStatus = String(safeUpdates.status);
      const allowedTransition = nextStatus === 'rejected'
        ? ['draft', 'moderation', 'approved'].includes(currentStatus)
        : nextStatus === 'approved'
          ? ['draft', 'moderation'].includes(currentStatus)
          : nextStatus === 'published' && currentStatus === 'approved';
      if (!allowedTransition) return NextResponse.json({ error: 'Product moderation status transition is not allowed.' }, { status: 409 });
      if (nextStatus === 'published') {
        const safeMedia = await models.ProductMedia.exists({ product_id: body.id, is_private: true, scan_status: 'clean' });
        if (!safeMedia) return NextResponse.json({ error: 'Product cannot be published until private storage and malware scanning confirm a safe delivery asset.' }, { status: 409 });
      }
    }
    if (body.table === 'demands' && safeUpdates.status === 'published' && user.role === 'admin') {
      const demand = await Model.findById(body.id);
      if (!demand) return NextResponse.json({ error: 'Demand not found.' }, { status: 404 });
      if (demand.get('status') !== 'moderation') return NextResponse.json({ error: 'Only demands under moderation can be published.' }, { status: 409 });
      const business = await User.findOne({ _id: demand.get('business_id'), role: 'business', verification_status: 'verified', business_terms_accepted: true });
      if (!business) return NextResponse.json({ error: 'Demands can only be published for verified businesses with accepted terms.' }, { status: 403 });
    }
    if (body.table === 'profiles' && user.role === 'admin' && 'verification_status' in safeUpdates) {
      const business = await User.findOne({ _id: body.id, role: 'business' });
      if (!business) return NextResponse.json({ error: 'Only a business account can be verified.' }, { status: 400 });
    }
    if (body.table === 'reports' && user.role === 'admin' && !['open', 'reviewing', 'resolved', 'dismissed'].includes(String(safeUpdates.status))) {
      return NextResponse.json({ error: 'Invalid report status.' }, { status: 400 });
    }
    if (body.table === 'reviews' && user.role === 'admin' && !['active', 'reported', 'removed'].includes(String(safeUpdates.status))) {
      return NextResponse.json({ error: 'Invalid review status.' }, { status: 400 });
    }
    if (body.table === 'product_requests' && user.role === 'admin' && !['open', 'reviewing', 'closed'].includes(String(safeUpdates.status))) {
      return NextResponse.json({ error: 'Invalid product-request status.' }, { status: 400 });
    }
    const session = user.role === 'admin' ? await mongoose.startSession() : null;
    let record;
    try {
      if (session) {
        await session.withTransaction(async () => {
          record = await Model.findOneAndUpdate(filter, { $set: safeUpdates }, { new: true, runValidators: true, session }).lean();
          if (record) {
            await collectionModels.audit_logs.create([{
              admin_id: user._id,
              action: 'record_updated',
              target_type: body.table,
              target_id: body.id,
              details: safeUpdates,
            }], { session });
          }
        });
      } else {
        record = await Model.findOneAndUpdate(filter, { $set: safeUpdates }, { new: true, runValidators: true }).lean();
      }
    } finally {
      await session?.endSession();
    }
    if (!record) return NextResponse.json({ error: 'Record not found or not accessible.' }, { status: 404 });
    return NextResponse.json(serialize(record as Record<string, unknown>));
  } catch (error) {
    return dataError(error, 'Unable to update record.');
  }
}

export async function PATCH(request: NextRequest) {
  return mutate(request, 'PATCH');
}

export async function DELETE(request: NextRequest) {
  return mutate(request, 'DELETE');
}
