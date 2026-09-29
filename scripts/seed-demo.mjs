import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import nextEnv from '@next/env';

nextEnv.loadEnvConfig(process.cwd());
const { MONGODB_URI, DEMO_SEED_ALLOW, NODE_ENV } = process.env;
const DEMO_PASSWORD = 'KraftoDemo!2026';
const DEMO_ONLY = 'YES';

if (NODE_ENV === 'production') {
  throw new Error('Demo seeding is disabled in production.');
}
if (DEMO_SEED_ALLOW !== DEMO_ONLY) {
  throw new Error(`Set DEMO_SEED_ALLOW=${DEMO_ONLY} explicitly to seed demo-only accounts and listings.`);
}
if (!MONGODB_URI) {
  throw new Error('Set MONGODB_URI to a development/demo database before seeding.');
}

const demoUsers = [
  {
    id: '650000000000000000000001',
    seedKey: 'user:buyer',
    email: 'buyer@krafto-demo.test',
    display_name: 'Aarav Mehta',
    role: 'buyer',
    location: 'Mumbai, India',
  },
  {
    id: '650000000000000000000002',
    seedKey: 'user:creator',
    email: 'creator@krafto-demo.test',
    display_name: 'Mira Sen',
    role: 'creator',
    location: 'Kolkata, India',
    bio: 'Independent designer creating practical digital tools for thoughtful brands.',
    skills: ['Brand identity', 'Illustration', 'Typography'],
    categories: ['Design', 'Fonts'],
    creator_onboarded: true,
    creator_terms_accepted: true,
  },
  {
    id: '650000000000000000000003',
    seedKey: 'user:business-verified',
    email: 'business@krafto-demo.test',
    display_name: 'Studio Terra Team',
    role: 'business',
    location: 'Bengaluru, India',
    business_name: 'Studio Terra',
    business_category: 'Home & lifestyle',
    website: 'https://example.com',
    verification_status: 'verified',
    business_terms_accepted: true,
  },
  {
    id: '650000000000000000000004',
    seedKey: 'user:business-pending',
    email: 'pending-business@krafto-demo.test',
    display_name: 'Northstar Learning Team',
    role: 'business',
    location: 'Pune, India',
    business_name: 'Northstar Learning',
    business_category: 'Education',
    verification_status: 'pending',
    business_terms_accepted: true,
  },
  {
    id: '650000000000000000000005',
    seedKey: 'user:admin',
    email: 'admin@krafto-demo.test',
    display_name: 'Krafto Demo Admin',
    role: 'admin',
    location: 'India',
  },
];

const products = [
  {
    id: '660000000000000000000001',
    seedKey: 'product:brand-kit',
    title: 'The Everyday Brand Kit',
    description: 'A warm, flexible visual identity starter kit for independent shops and makers.',
    category: 'Design',
    price: 1499,
    file_format: 'Figma',
    tags: ['branding', 'small business', 'identity'],
    rating: 0,
    sales_count: 0,
  },
  {
    id: '660000000000000000000002',
    seedKey: 'product:font-pairing',
    title: 'Field Notes Display Fonts',
    description: 'A friendly display type pairing for packaging, editorial, and campaign work.',
    category: 'Fonts',
    price: 899,
    file_format: 'OTF',
    tags: ['typography', 'fonts', 'editorial'],
    rating: 0,
    sales_count: 0,
  },
  {
    id: '660000000000000000000003',
    seedKey: 'product:social-templates',
    title: 'Small Shop Social Templates',
    description: 'A set of editable layouts to help independent shops tell their story online.',
    category: 'Design',
    price: 699,
    file_format: 'Figma',
    tags: ['social', 'templates', 'retail'],
    rating: 0,
    sales_count: 0,
  },
  {
    id: '660000000000000000000004',
    seedKey: 'product:ambient-audio',
    title: 'Monsoon Morning Sound Pack',
    description: 'An original collection of gentle ambient textures for short-form projects.',
    category: 'Audio',
    price: 499,
    file_format: 'WAV',
    tags: ['audio', 'ambient', 'sound'],
    rating: 0,
    sales_count: 0,
  },
  {
    id: '660000000000000000000005',
    seedKey: 'product:motion-titles',
    title: 'Soft Motion Title Cards',
    description: 'A minimal set of title-card concepts for independent filmmakers and editors.',
    category: 'Motion & 3D',
    price: 1199,
    file_format: 'MP4',
    tags: ['motion', 'video', 'titles'],
    rating: 0,
    sales_count: 0,
  },
];

const demands = [
  {
    id: '670000000000000000000001',
    seedKey: 'demand:packaging',
    business: 'business-verified',
    title: 'Illustrated packaging for a new tea range',
    description: 'Looking for a distinctive, print-ready illustration direction for a small-batch Indian tea launch.',
    category: 'Design',
    product_type: 'Packaging illustration',
    budget: '₹15,000–₹25,000',
    quantity: 1,
    deadline: 'Flexible',
    status: 'published',
    visibility: 'public',
    genuine_requirement_confirmed: true,
  },
  {
    id: '670000000000000000000002',
    seedKey: 'demand:learning',
    business: 'business-pending',
    title: 'Visual worksheets for an early-learning course',
    description: 'We are exploring a set of engaging, accessible printable activity sheets for a new learning programme.',
    category: 'Design',
    product_type: 'Learning materials',
    budget: '₹8,000–₹12,000',
    quantity: 1,
    deadline: 'Flexible',
    status: 'moderation',
    visibility: 'public',
    genuine_requirement_confirmed: true,
  },
];

const now = new Date();
const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

try {
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;
  if (!db) throw new Error('Unable to access the configured demo database.');

  const users = db.collection('users');
  const seededUsers = new Map();
  for (const user of demoUsers) {
    const byEmail = await users.findOne({ email: user.email });
    if (byEmail && byEmail.demo_seed_key !== user.seedKey) {
      throw new Error(`Refusing to overwrite non-demo account ${user.email}.`);
    }
    const existing = byEmail || await users.findOne({ demo_seed_key: user.seedKey });
    const _id = existing?._id || new mongoose.Types.ObjectId(user.id);
    await users.updateOne(
      { _id },
      {
        $set: {
          email: user.email,
          password_hash: passwordHash,
          display_name: user.display_name,
          role: user.role,
          roles: [user.role],
          bio: user.bio || null,
          skills: user.skills || [],
          categories: user.categories || [],
          location: user.location,
          business_name: user.business_name || null,
          business_category: user.business_category || null,
          website: user.website || null,
          verification_status: user.verification_status || 'pending',
          creator_onboarded: user.creator_onboarded || false,
          terms_accepted: true,
          privacy_accepted: true,
          age_confirmed: true,
          creator_terms_accepted: user.creator_terms_accepted || false,
          business_terms_accepted: user.business_terms_accepted || false,
          policy_version: 'demo-1.0',
          consent_timestamp: now,
          suspended: false,
          deleted_at: null,
          demo_seed_key: user.seedKey,
          updated_at: now,
        },
        $setOnInsert: { created_at: now },
      },
      { upsert: true },
    );
    seededUsers.set(user.seedKey.slice('user:'.length), _id);
  }

  const productCollection = db.collection('products');
  for (const product of products) {
    const { id, seedKey, ...fields } = product;
    const existing = await productCollection.findOne({ demo_seed_key: seedKey });
    const _id = existing?._id || new mongoose.Types.ObjectId(id);
    await productCollection.updateOne(
      { _id },
      {
        $set: {
          ...fields,
          creator_id: seededUsers.get('creator'),
          description: fields.description,
          image_url: null,
          license_type: 'commercial',
          language: 'English',
          is_digital: true,
          status: 'published',
          ip_declaration_accepted: true,
          demand_id: null,
          demo_seed_key: seedKey,
          updated_at: now,
        },
        $setOnInsert: { created_at: now },
      },
      { upsert: true },
    );
  }

  const moderationProduct = {
    _id: new mongoose.Types.ObjectId('660000000000000000000006'),
    creator_id: seededUsers.get('creator'),
    title: 'Demo listing awaiting review',
    description: 'A sample moderation queue entry. It has no downloadable asset and cannot be published for sale.',
    category: 'Design',
    price: 0,
    file_format: 'Figma',
    tags: ['demo', 'moderation'],
    license_type: 'commercial',
    language: 'English',
    is_digital: true,
    status: 'moderation',
    ip_declaration_accepted: true,
    rating: 0,
    sales_count: 0,
    demo_seed_key: 'product:moderation-example',
    created_at: now,
    updated_at: now,
  };
  await productCollection.updateOne(
    { _id: (await productCollection.findOne({ demo_seed_key: moderationProduct.demo_seed_key }))?._id || moderationProduct._id },
    {
      $set: Object.fromEntries(Object.entries(moderationProduct).filter(([key]) => key !== '_id' && key !== 'created_at')),
      $setOnInsert: { created_at: now },
    },
    { upsert: true },
  );

  const demandCollection = db.collection('demands');
  for (const demand of demands) {
    const { id, seedKey, business, ...fields } = demand;
    const existing = await demandCollection.findOne({ demo_seed_key: seedKey });
    const _id = existing?._id || new mongoose.Types.ObjectId(id);
    await demandCollection.updateOne(
      { _id },
      {
        $set: {
          ...fields,
          business_id: seededUsers.get(business),
          is_digital: true,
          language: 'English',
          response_count: 0,
          demo_seed_key: seedKey,
          updated_at: now,
        },
        $setOnInsert: { created_at: now },
      },
      { upsert: true },
    );
  }

  console.log('Demo seed complete. No real sales, payments, reviews, downloads, or payouts were created.');
  console.log(`Shared demo password: ${DEMO_PASSWORD}`);
  for (const user of demoUsers) console.log(`${user.role.padEnd(8)} ${user.email}`);
} finally {
  await mongoose.disconnect();
}
