import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

const { MONGODB_URI, BOOTSTRAP_ADMIN_EMAIL, BOOTSTRAP_ADMIN_PASSWORD } = process.env;

if (!MONGODB_URI || !BOOTSTRAP_ADMIN_EMAIL || !BOOTSTRAP_ADMIN_PASSWORD) {
  throw new Error('Set MONGODB_URI, BOOTSTRAP_ADMIN_EMAIL, and BOOTSTRAP_ADMIN_PASSWORD before running this command.');
}
if (BOOTSTRAP_ADMIN_PASSWORD.length < 16) {
  throw new Error('The bootstrap admin password must be at least 16 characters.');
}

try {
  await mongoose.connect(MONGODB_URI);
  const users = mongoose.connection.collection('users');
  const email = BOOTSTRAP_ADMIN_EMAIL.trim().toLowerCase();
  await users.createIndex({ email: 1 }, { unique: true });
  const existing = await users.findOne({ email });
  if (existing) throw new Error('An account with that email already exists; refusing to change its role or credentials.');
  await users.insertOne({
    email,
    password_hash: await bcrypt.hash(BOOTSTRAP_ADMIN_PASSWORD, 12),
    display_name: 'Marketplace Admin',
    role: 'admin',
    roles: ['admin'],
    terms_accepted: true,
    privacy_accepted: true,
    policy_version: '1.0',
    consent_timestamp: new Date(),
    verification_status: 'pending',
    creator_onboarded: false,
    creator_terms_accepted: false,
    business_terms_accepted: false,
    suspended: false,
    created_at: new Date(),
    updated_at: new Date(),
  });
  console.log(`Created admin account for ${email}. Configure and remove the bootstrap credentials from the environment.`);
} finally {
  await mongoose.disconnect();
}
