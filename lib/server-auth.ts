import { createHash } from 'crypto';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import mongoose from 'mongoose';
import { models, User } from '@/lib/models';
import { connectToDatabase } from '@/lib/db';

const COOKIE_NAME = 'krafto_session';
const SESSION_DURATION = 60 * 60 * 24 * 7;
const tokenHash = (token: string) => createHash('sha256').update(token).digest('hex');

function signingKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) throw new Error('SESSION_SECRET must be set to at least 32 characters.');
  return new TextEncoder().encode(secret);
}

export function assertSessionConfiguration() {
  signingKey();
}

export async function createSession(userId: string, dbSession?: mongoose.ClientSession) {
  const token = await new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION}s`)
    .sign(signingKey());
  await connectToDatabase();
  await models.Session.create([{
    user_id: userId,
    token_hash: tokenHash(token),
    expires_at: new Date(Date.now() + SESSION_DURATION * 1000),
  }], dbSession ? { session: dbSession } : undefined);
  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_DURATION,
  });
}

export async function clearSession() {
  const token = cookies().get(COOKIE_NAME)?.value;
  try {
    if (token) {
      await connectToDatabase();
      await models.Session.deleteOne({ token_hash: tokenHash(token) });
    }
  } finally {
    cookies().delete(COOKIE_NAME);
  }
}

export async function getCurrentUser() {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return null;
  const key = signingKey();
  let subject: string | undefined;
  try {
    const { payload } = await jwtVerify(token, key);
    subject = typeof payload.sub === 'string' ? payload.sub : undefined;
  } catch {
    return null;
  }
  if (!subject) return null;
  await connectToDatabase();
  const session = await models.Session.findOne({ user_id: subject, token_hash: tokenHash(token), expires_at: { $gt: new Date() } }).select('_id');
  if (!session) return null;
  const user = await User.findById(subject).select('+password_hash');
  if (!user || user.suspended || user.deleted_at) return null;
  return user;
}

export function publicProfile(user: Record<string, unknown> & { _id: { toString(): string } }) {
  const { password_hash: _passwordHash, payout_reference: _payoutReference, ...profile } = user;
  return { ...profile, id: user._id.toString(), email: user.email };
}
