import mongoose from 'mongoose';

const mongoUri = process.env.MONGODB_URI;

type CachedConnection = { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };
const globalWithMongoose = globalThis as typeof globalThis & { mongooseCache?: CachedConnection };
const cache = globalWithMongoose.mongooseCache ?? { conn: null, promise: null };
globalWithMongoose.mongooseCache = cache;

export async function connectToDatabase() {
  if (!mongoUri) throw new Error('MongoDB is not configured. Set MONGODB_URI to your Atlas connection string.');
  if (cache.conn) return cache.conn;
  if (!cache.promise) {
    cache.promise = mongoose.connect(mongoUri, { bufferCommands: false });
  }
  try {
    cache.conn = await cache.promise;
  } catch (error) {
    cache.promise = null;
    throw error;
  }
  return cache.conn;
}
