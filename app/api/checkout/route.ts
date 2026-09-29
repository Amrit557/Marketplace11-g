import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/db';
import { models } from '@/lib/models';
import { getCurrentUser } from '@/lib/server-auth';
import { DEMO_MODE } from '@/lib/demo-mode';

export const runtime = 'nodejs';

function configuredRate(name: string, fallback: number) {
  const configured = process.env[name];
  if (configured === undefined || configured === '') return fallback;
  const parsed = Number(configured);
  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 10000) throw new Error(`${name} must be an integer between 0 and 10000 basis points.`);
  return parsed;
}

const commissionBps = () => configuredRate('PLATFORM_COMMISSION_BPS', 500);
const taxBps = () => configuredRate('CHECKOUT_TAX_BPS', 0);

export async function GET(request: NextRequest) {
  if (DEMO_MODE) return NextResponse.json({ error: 'The backend API is disabled in display demo mode.' }, { status: 503 });
  try {
    const result: { commissionBps: number; taxBps: number; paymentEnabled: boolean; products?: Record<string, unknown>[] } = {
      commissionBps: commissionBps(),
      taxBps: taxBps(),
      paymentEnabled: false,
    };
    const productIds = request.nextUrl.searchParams.get('productIds')?.split(',').filter(Boolean) || [];
    if (productIds.length) {
      if (productIds.length > 50 || new Set(productIds).size !== productIds.length) {
        return NextResponse.json({ error: 'The cart contains invalid product IDs.' }, { status: 400 });
      }
      await connectToDatabase();
      const products = await models.Product.find({ _id: { $in: productIds }, status: 'published' })
        .populate({ path: 'creator_id', select: 'display_name' });
      result.products = products.map((product) => {
        const seller = product.get('creator_id') as { display_name?: string } | null;
        return {
          id: product._id.toString(),
          title: product.get('title'),
          price: product.get('price'),
          category: product.get('category'),
          seller_name: seller?.display_name || 'Independent creator',
        };
      });
    }
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Checkout rates are invalid.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (DEMO_MODE) return NextResponse.json({ error: 'The backend API is disabled in display demo mode.' }, { status: 503 });
  try {
    const origin = request.headers.get('origin');
    if (origin && origin !== request.nextUrl.origin) return NextResponse.json({ error: 'Cross-origin request rejected.' }, { status: 403 });
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Sign in to continue.' }, { status: 401 });
    if (!['buyer', 'business'].includes(user.role)) return NextResponse.json({ error: 'Use a buyer workspace to purchase products.' }, { status: 403 });
    const body = await request.json();
    if (body.termsAccepted !== true || !Array.isArray(body.productIds) || body.productIds.length < 1 || body.productIds.length > 50) {
      return NextResponse.json({ error: 'Accept the purchase terms and provide between 1 and 50 products.' }, { status: 400 });
    }
    if (body.productIds.some((id: unknown) => typeof id !== 'string' || !mongoose.isValidObjectId(id)) ||
      new Set(body.productIds).size !== body.productIds.length) {
      return NextResponse.json({ error: 'The cart contains invalid or duplicate product IDs.' }, { status: 400 });
    }
    const expectedQuote = [body.expectedSubtotal, body.expectedPlatformFee, body.expectedTax]
      .every((amount) => Number.isSafeInteger(amount) && amount >= 0);
    if (!expectedQuote) {
      return NextResponse.json({ error: 'Refresh checkout to confirm the current order total.' }, { status: 400 });
    }

    await connectToDatabase();
    const session = await mongoose.startSession();
    let orderId = '';
    let subtotal = 0;
    let platformFee = 0;
    let tax = 0;
    try {
      await session.withTransaction(async () => {
        const products = await models.Product.find({ _id: { $in: body.productIds }, status: 'published' })
          .populate({ path: 'creator_id', select: 'display_name role suspended deleted_at' })
          .session(session)
          .lean();
        if (products.length !== body.productIds.length) {
          throw new CheckoutError('One or more products are no longer available.', 409);
        }
        const lines = products.map((product) => {
          const creator = product.creator_id as {
            _id: mongoose.Types.ObjectId;
            display_name: string;
            role: string;
            suspended?: boolean;
            deleted_at?: Date | null;
          } | null;
          if (!creator || creator.role !== 'creator' || creator.suspended || creator.deleted_at) {
            throw new CheckoutError('A product seller is no longer available.', 409);
          }
          if (creator._id.toString() === user._id.toString()) {
            throw new CheckoutError('You cannot purchase your own product.', 400);
          }
          const price = Number(product.price);
          if (!Number.isSafeInteger(price) || price < 0) {
            throw new CheckoutError('A product has an invalid price.', 409);
          }
          return {
            product,
            creator,
            price,
          };
        });
        subtotal = lines.reduce((sum, line) => sum + line.price, 0);
        if (!Number.isSafeInteger(subtotal)) throw new CheckoutError('The order total is too large.', 400);
        platformFee = basisPointAmount(subtotal, commissionBps());
        const taxableAmount = subtotal + platformFee;
        if (!Number.isSafeInteger(taxableAmount)) throw new CheckoutError('The order total is too large.', 400);
        tax = basisPointAmount(taxableAmount, taxBps());
        const currentQuote = [subtotal, platformFee, tax];
        if (currentQuote.some((amount, index) => amount !== [body.expectedSubtotal, body.expectedPlatformFee, body.expectedTax][index])) {
          throw new CheckoutError('Prices or fees changed. Refresh checkout to review the updated total.', 409);
        }
        const grandTotal = subtotal + platformFee + tax;
        if (!Number.isSafeInteger(grandTotal)) throw new CheckoutError('The order total is too large.', 400);

        const feeShares = allocateFee(lines.map((line) => line.price), commissionBps(), platformFee);
        const [order] = await models.Order.create([{
          buyer_id: user._id,
          status: 'pending',
          subtotal,
          platform_fee: platformFee,
          tax,
          total: grandTotal,
          terms_accepted: true,
          terms_version: '1.0',
        }], { session });
        orderId = order._id.toString();
        await models.OrderItem.create(lines.map((line, index) => ({
          order_id: order._id,
          product_id: line.product._id,
          creator_id: line.creator._id,
          product_title: line.product.title,
          product_category: line.product.category,
          creator_name: line.creator.display_name,
          price: line.price,
          platform_fee: feeShares[index],
          creator_payable: line.price - feeShares[index],
        })), { session });
      });
    } finally {
      await session.endSession();
    }
    return NextResponse.json({
      orderId,
      paymentEnabled: false,
      subtotal,
      platformFee,
      tax,
      total: subtotal + platformFee + tax,
    }, { status: 201 });
  } catch (error) {
    if (error instanceof CheckoutError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to initiate checkout.' }, { status: 503 });
  }
}

class CheckoutError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = 'CheckoutError';
  }
}

function allocateFee(prices: number[], feeBps: number, totalFee: number) {
  const allocations = prices.map((price, index) => ({
    index,
    fee: Math.floor(price / 10000) * feeBps + Math.floor((price % 10000) * feeBps / 10000),
    remainder: ((price % 10000) * feeBps) % 10000,
  }));
  let remaining = totalFee - allocations.reduce((sum, allocation) => sum + allocation.fee, 0);
  allocations.sort((left, right) => right.remainder - left.remainder);
  for (let index = 0; index < allocations.length && remaining > 0; index += 1, remaining -= 1) {
    allocations[index].fee += 1;
  }
  return allocations.sort((left, right) => left.index - right.index).map((allocation) => allocation.fee);
}

function basisPointAmount(amount: number, bps: number) {
  return Math.floor(amount / 10000) * bps + Math.round((amount % 10000) * bps / 10000);
}
