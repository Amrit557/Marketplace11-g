import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/db';
import { User } from '@/lib/models';
import { assertSessionConfiguration, clearSession, createSession, getCurrentUser, publicProfile } from '@/lib/server-auth';
import { DEMO_MODE } from '@/lib/demo-mode';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const authAttempts = new Map<string, { startedAt: number; count: number }>();
const AUTH_WINDOW_MS = 15 * 60 * 1000;
const AUTH_ATTEMPT_LIMIT = 10;

function isValidWebsite(value: unknown) {
  if (typeof value !== 'string' || !value.trim()) return true;
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password;
  } catch {
    return false;
  }
}

function isRateLimited(request: NextRequest) {
  const key = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';
  const now = Date.now();
  const current = authAttempts.get(key);
  if (!current || now - current.startedAt >= AUTH_WINDOW_MS) {
    authAttempts.set(key, { startedAt: now, count: 1 });
    return false;
  }
  current.count += 1;
  return current.count > AUTH_ATTEMPT_LIMIT;
}

export async function GET() {
  if (DEMO_MODE) return NextResponse.json({ error: 'The backend API is disabled in display demo mode.' }, { status: 503 });
  try {
    const user = await getCurrentUser();
    return NextResponse.json({ user: user ? publicProfile(user.toObject()) : null });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to load session.' }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  if (DEMO_MODE) return NextResponse.json({ error: 'The backend API is disabled in display demo mode.' }, { status: 503 });
  try {
    const origin = request.headers.get('origin');
    if (origin && origin !== request.nextUrl.origin) return NextResponse.json({ error: 'Cross-origin request rejected.' }, { status: 403 });
    if (isRateLimited(request)) return NextResponse.json({ error: 'Too many authentication attempts. Try again later.' }, { status: 429 });
    await connectToDatabase();
    const body = await request.json();
    const action = body.action;
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    if (!emailPattern.test(email) || password.length < 10 || password.length > 128) {
      return NextResponse.json({ error: 'Enter a valid email and a password between 10 and 128 characters.' }, { status: 400 });
    }
    assertSessionConfiguration();

    if (action === 'register') {
      const { role, display_name: displayName, business_name: businessName, business_category: businessCategory, terms_accepted: terms, privacy_accepted: privacy, creator_terms_accepted: creatorTerms, business_terms_accepted: businessTerms } = body;
      if (!['buyer', 'creator', 'business'].includes(role) || typeof displayName !== 'string' || !displayName.trim() || displayName.length > 100) {
        return NextResponse.json({ error: 'Choose an account type and enter your display name.' }, { status: 400 });
      }
      if (terms !== true || privacy !== true || body.age_confirmed !== true || (role === 'creator' && creatorTerms !== true) || (role === 'business' && businessTerms !== true)) {
        return NextResponse.json({ error: 'Accept the required policies and role-specific agreement to continue.' }, { status: 400 });
      }
      const minimumAge = Number(process.env.MINIMUM_AGE_YEARS ?? 18);
      if (!Number.isInteger(minimumAge) || minimumAge < 13 || minimumAge > 100) {
        return NextResponse.json({ error: 'MINIMUM_AGE_YEARS must be configured as an integer between 13 and 100.' }, { status: 500 });
      }
      if (role === 'business' && (typeof businessName !== 'string' || !businessName.trim())) {
        return NextResponse.json({ error: 'Business name is required.' }, { status: 400 });
      }
      if (!isValidWebsite(body.website)) return NextResponse.json({ error: 'Enter a valid http or https website URL.' }, { status: 400 });
      const passwordHash = await bcrypt.hash(password, 12);
      const dbSession = await mongoose.startSession();
      let createdProfile: ReturnType<typeof publicProfile> | null = null;
      try {
        await dbSession.withTransaction(async () => {
          const [user] = await User.create([{
            email,
            password_hash: passwordHash,
            display_name: displayName.trim(),
            role,
            roles: [role],
            business_name: role === 'business' ? businessName.trim() : null,
            business_category: role === 'business' ? businessCategory || null : null,
            location: typeof body.location === 'string' ? body.location.trim() : null,
            website: typeof body.website === 'string' && body.website.trim() ? body.website.trim() : null,
            terms_accepted: true,
            privacy_accepted: true,
            age_confirmed: true,
            creator_terms_accepted: role === 'creator',
            business_terms_accepted: role === 'business',
            policy_version: '1.0',
            consent_timestamp: new Date(),
          }], { session: dbSession });
          await createSession(user._id.toString(), dbSession);
          createdProfile = publicProfile(user.toObject());
        });
      } finally {
        await dbSession.endSession();
      }
      if (!createdProfile) throw new Error('Account creation transaction did not complete.');
      return NextResponse.json({ user: createdProfile }, { status: 201 });
    }

    if (action === 'login') {
      const user = await User.findOne({ email }).select('+password_hash');
      if (!user || !(await bcrypt.compare(password, user.password_hash))) {
        return NextResponse.json({ error: 'Email or password is incorrect.' }, { status: 401 });
      }
      if (user.suspended || user.deleted_at) return NextResponse.json({ error: 'This account is currently unavailable.' }, { status: 403 });
      await createSession(user._id.toString());
      return NextResponse.json({ user: publicProfile(user.toObject()) });
    }
    return NextResponse.json({ error: 'Unsupported authentication action.' }, { status: 400 });
  } catch (error) {
    const duplicateEmail = error instanceof Error && 'code' in error && error.code === 11000;
    const message = duplicateEmail ? 'An account with this email already exists.' : error instanceof Error ? error.message : 'Authentication request failed.';
    const invalidRequest = error instanceof SyntaxError || error instanceof mongoose.Error.ValidationError || error instanceof mongoose.Error.CastError;
    return NextResponse.json({ error: message }, { status: duplicateEmail ? 409 : invalidRequest ? 400 : 503 });
  }
}

export async function DELETE() {
  if (DEMO_MODE) return NextResponse.json({ error: 'The backend API is disabled in display demo mode.' }, { status: 503 });
  try {
    await clearSession();
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to revoke the server session.' }, { status: 503 });
  }
}
