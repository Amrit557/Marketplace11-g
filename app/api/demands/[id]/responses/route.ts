import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/db';
import { models } from '@/lib/models';
import { getCurrentUser } from '@/lib/server-auth';
import { DEMO_MODE } from '@/lib/demo-mode';

export const runtime = 'nodejs';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  if (DEMO_MODE) return NextResponse.json({ error: 'The backend API is disabled in display demo mode.' }, { status: 503 });
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Sign in to continue.' }, { status: 401 });
    if (user.role !== 'creator' || !user.creator_terms_accepted) {
      return NextResponse.json({ error: 'An onboarded creator account is required.' }, { status: 403 });
    }
    const origin = request.headers.get('origin');
    if (origin && origin !== request.nextUrl.origin) return NextResponse.json({ error: 'Cross-origin request rejected.' }, { status: 403 });
    if (!mongoose.isValidObjectId(params.id)) return NextResponse.json({ error: 'Invalid demand.' }, { status: 400 });
    await connectToDatabase();
    const body = await request.json();
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    const description = typeof body.description === 'string' ? body.description.trim() : '';
    const category = typeof body.category === 'string' ? body.category.trim() : '';
    const price = Number(body.price);
    if (!title || title.length > 160 || !category || category.length > 80 || description.length > 10000 || !Number.isInteger(price) || price < 0 || body.ipDeclarationAccepted !== true) {
      return NextResponse.json({ error: 'Complete the product details and rights declaration with a valid whole-rupee price.' }, { status: 400 });
    }
    const demand = await models.Demand.findOne({ _id: params.id, status: 'published', visibility: 'public' });
    if (!demand) return NextResponse.json({ error: 'This demand is no longer available.' }, { status: 404 });

    const session = await mongoose.startSession();
    let productId = '';
    try {
      await session.withTransaction(async () => {
        const [product] = await models.Product.create([{
          creator_id: user._id,
          title,
          description,
          category,
          price,
          demand_id: demand._id,
          ip_declaration_accepted: true,
          status: 'moderation',
          is_digital: true,
          license_type: 'commercial',
          language: 'English',
        }], { session });
        productId = product._id.toString();
        await models.DemandResponse.create([{
          demand_id: demand._id,
          creator_id: user._id,
          product_id: product._id,
          status: 'submitted',
        }], { session });
        await models.Demand.updateOne({ _id: demand._id }, { $inc: { response_count: 1 } }, { session });
        await models.Notification.create([{
          user_id: demand.business_id,
          type: 'demand_response',
          title: 'A creator responded to your demand',
          message: 'A linked product draft was submitted for moderation. It is not a purchase commitment.',
          link: `/demands/${demand._id}`,
        }], { session });
      });
    } finally {
      await session.endSession();
    }
    return NextResponse.json({ productId }, { status: 201 });
  } catch (error) {
    const duplicateResponse = error instanceof Error && 'code' in error && error.code === 11000;
    return NextResponse.json({
      error: duplicateResponse ? 'You have already responded to this demand.' : error instanceof Error ? error.message : 'Unable to submit your response.',
    }, { status: duplicateResponse ? 409 : 503 });
  }
}
