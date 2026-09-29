import mongoose, { Schema } from 'mongoose';

const { ObjectId, Mixed } = Schema.Types;
const timestamps = { createdAt: 'created_at', updatedAt: 'updated_at' };

const userSchema = new Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  password_hash: { type: String, required: true, select: false },
  display_name: { type: String, required: true, trim: true, maxlength: 100 },
  role: { type: String, enum: ['buyer', 'creator', 'business', 'admin'], required: true },
  roles: { type: [String], enum: ['buyer', 'creator', 'business', 'admin'], default: [] },
  bio: { type: String, maxlength: 2000, default: null },
  avatar_url: { type: String, default: null },
  skills: { type: [String], default: [] },
  categories: { type: [String], default: [] },
  languages: { type: [String], default: [] },
  location: { type: String, default: null },
  business_name: { type: String, default: null },
  business_category: { type: String, default: null },
  website: { type: String, default: null },
  verification_status: { type: String, enum: ['pending', 'verified', 'rejected', 'additional_info_required'], default: 'pending' },
  creator_onboarded: { type: Boolean, default: false },
  terms_accepted: { type: Boolean, default: false },
  privacy_accepted: { type: Boolean, default: false },
  age_confirmed: { type: Boolean, default: false },
  creator_terms_accepted: { type: Boolean, default: false },
  business_terms_accepted: { type: Boolean, default: false },
  policy_version: { type: String, default: '1.0' },
  consent_timestamp: { type: Date, default: null },
  suspended: { type: Boolean, default: false },
  deleted_at: { type: Date, default: null },
  demo_seed_key: { type: String, select: false },
}, { timestamps });

const productSchema = new Schema({
  creator_id: { type: ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 160 },
  description: { type: String, maxlength: 10000, default: '' },
  category: { type: String, required: true, index: true },
  price: { type: Number, required: true, min: 0, validate: Number.isInteger },
  image_url: String,
  file_url: { type: String, select: false },
  file_format: String,
  license_type: { type: String, default: 'commercial' },
  language: { type: String, default: 'English' },
  tags: [String],
  is_digital: { type: Boolean, default: true },
  status: { type: String, enum: ['draft', 'moderation', 'approved', 'published', 'rejected'], default: 'draft', index: true },
  demand_id: { type: ObjectId, ref: 'Demand', default: null },
  ip_declaration_accepted: { type: Boolean, default: false },
  rejection_reason: String,
  rating: { type: Number, min: 0, max: 5, default: 0 },
  sales_count: { type: Number, min: 0, default: 0 },
  demo_seed_key: { type: String, select: false },
}, { timestamps });
productSchema.index({ status: 1, category: 1, created_at: -1 });
productSchema.index({ title: 'text', description: 'text', tags: 'text' });

const demandSchema = new Schema({
  business_id: { type: ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 160 },
  description: { type: String, maxlength: 10000, default: '' },
  category: { type: String, required: true, index: true },
  product_type: String,
  budget: String,
  quantity: { type: Number, min: 1 },
  deadline: String,
  is_digital: { type: Boolean, default: true },
  language: { type: String, default: 'English' },
  location: String,
  visibility: { type: String, enum: ['public', 'private'], default: 'public' },
  genuine_requirement_confirmed: { type: Boolean, default: false },
  status: { type: String, enum: ['draft', 'moderation', 'published', 'closed', 'rejected'], default: 'draft', index: true },
  rejection_reason: String,
  response_count: { type: Number, min: 0, default: 0 },
  demo_seed_key: { type: String, select: false },
}, { timestamps });
demandSchema.index({ status: 1, category: 1, created_at: -1 });
demandSchema.index({ title: 'text', description: 'text' });

const demandResponseSchema = new Schema({
  demand_id: { type: ObjectId, ref: 'Demand', required: true, index: true },
  creator_id: { type: ObjectId, ref: 'User', required: true },
  product_id: { type: ObjectId, ref: 'Product', required: true },
  status: { type: String, enum: ['submitted', 'reviewed', 'declined'], default: 'submitted' },
}, { timestamps });
demandResponseSchema.index({ demand_id: 1, creator_id: 1 }, { unique: true });

const orderSchema = new Schema({
  buyer_id: { type: ObjectId, ref: 'User', required: true, index: true },
  status: { type: String, enum: ['pending', 'paid', 'failed', 'refunded', 'delivered'], default: 'pending' },
  payment_id: String,
  payment_method: String,
  subtotal: { type: Number, required: true, min: 0 },
  platform_fee: { type: Number, required: true, min: 0 },
  tax: { type: Number, required: true, min: 0, default: 0 },
  total: { type: Number, required: true, min: 0 },
  terms_accepted: { type: Boolean, required: true },
  terms_version: { type: String, required: true, default: '1.0' },
  paid_at: Date,
}, { timestamps });

const orderItemSchema = new Schema({
  order_id: { type: ObjectId, ref: 'Order', required: true, index: true },
  product_id: { type: ObjectId, ref: 'Product', required: true },
  creator_id: { type: ObjectId, ref: 'User', required: true },
  product_title: { type: String, required: true },
  product_category: { type: String, required: true },
  creator_name: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  platform_fee: { type: Number, required: true, min: 0 },
  creator_payable: { type: Number, required: true, min: 0 },
  payout_status: { type: String, enum: ['pending', 'paid', 'refunded'], default: 'pending' },
  download_count: { type: Number, default: 0 },
  download_expires_at: Date,
}, { timestamps });
const reviewSchema = new Schema({
  product_id: { type: ObjectId, ref: 'Product', index: true },
  buyer_id: { type: ObjectId, ref: 'User' },
  order_id: { type: ObjectId, ref: 'Order' },
  rating: { type: Number, min: 1, max: 5 },
  review_text: String,
  status: { type: String, default: 'active' },
}, { timestamps });
reviewSchema.index({ product_id: 1, buyer_id: 1 }, { unique: true });
const wishlistSchema = new Schema({
  user_id: { type: ObjectId, ref: 'User', required: true },
  product_id: { type: ObjectId, ref: 'Product', required: true },
}, { timestamps });
wishlistSchema.index({ user_id: 1, product_id: 1 }, { unique: true });

const schemas: Record<string, Schema> = {
  Session: new Schema({ user_id: { type: ObjectId, ref: 'User', required: true, index: true }, token_hash: { type: String, required: true, unique: true, select: false }, expires_at: { type: Date, required: true } }, { timestamps }),
  CreatorProfile: new Schema({ user_id: { type: ObjectId, ref: 'User', unique: true }, portfolio: [String], payout_reference: { type: String, select: false } }, { timestamps }),
  BusinessProfile: new Schema({ user_id: { type: ObjectId, ref: 'User', unique: true }, legal_name: String, category: String, website: String, contact_email: String, verification_documents: { type: [String], select: false }, verification_status: String, history: [Mixed] }, { timestamps }),
  Product: productSchema,
  ProductMedia: new Schema({ product_id: { type: ObjectId, ref: 'Product', index: true }, storage_key: { type: String, select: false }, media_type: String, file_size: Number, scan_status: String, is_private: Boolean }, { timestamps }),
  Category: new Schema({ name: { type: String, unique: true }, slug: { type: String, unique: true }, active: { type: Boolean, default: true } }, { timestamps }),
  Collection: new Schema({ title: String, slug: { type: String, unique: true }, product_ids: [{ type: ObjectId, ref: 'Product' }], published: Boolean }, { timestamps }),
  Demand: demandSchema,
  Order: orderSchema,
  OrderItem: orderItemSchema,
  Payment: new Schema({ order_id: { type: ObjectId, ref: 'Order', required: true, index: true }, provider: String, provider_payment_id: String, amount: Number, currency: { type: String, default: 'INR' }, status: { type: String, enum: ['created', 'authorized', 'captured', 'failed', 'refunded'] }, verified_at: Date, provider_payload: { type: Mixed, select: false } }, { timestamps }),
  Refund: new Schema({ order_id: { type: ObjectId, ref: 'Order', index: true }, payment_id: { type: ObjectId, ref: 'Payment' }, amount: Number, reason: String, status: String, provider_refund_id: String }, { timestamps }),
  Payout: new Schema({ creator_id: { type: ObjectId, ref: 'User', index: true }, amount: Number, status: String, provider_reference: { type: String, select: false }, paid_at: Date }, { timestamps }),
  TransactionLedger: new Schema({ order_id: { type: ObjectId, ref: 'Order', index: true }, order_item_id: { type: ObjectId, ref: 'OrderItem' }, creator_id: { type: ObjectId, ref: 'User', index: true }, entry_type: String, amount: Number, currency: { type: String, default: 'INR' }, status: String }, { timestamps }),
  Review: reviewSchema,
  Wishlist: wishlistSchema,
  Follow: new Schema({ follower_id: { type: ObjectId, ref: 'User' }, creator_id: { type: ObjectId, ref: 'User' } }, { timestamps }).index({ follower_id: 1, creator_id: 1 }, { unique: true }),
  Message: new Schema({ sender_id: { type: ObjectId, ref: 'User' }, recipient_id: { type: ObjectId, ref: 'User' }, body: String, related_demand_id: { type: ObjectId, ref: 'Demand' } }, { timestamps }),
  Notification: new Schema({ user_id: { type: ObjectId, ref: 'User', required: true, index: true }, type: String, title: String, message: String, link: String, read: { type: Boolean, default: false } }, { timestamps }),
  Report: new Schema({ reporter_id: { type: ObjectId, ref: 'User' }, target_type: String, target_id: ObjectId, reason: String, status: { type: String, default: 'open' } }, { timestamps }),
  Dispute: new Schema({ order_id: { type: ObjectId, ref: 'Order', index: true }, opened_by: { type: ObjectId, ref: 'User' }, reason: String, status: String }, { timestamps }),
  ProductRequest: new Schema({ user_id: { type: ObjectId, ref: 'User', required: true, index: true }, description: { type: String, required: true, maxlength: 2000 }, category: { type: String, required: true }, status: { type: String, enum: ['open', 'reviewing', 'closed'], default: 'open' } }, { timestamps }),
  Opportunity: new Schema({ title: String, category: String, demand_id: { type: ObjectId, ref: 'Demand' }, active: Boolean }, { timestamps }),
  DemandResponse: demandResponseSchema,
  AuditLog: new Schema({ admin_id: { type: ObjectId, ref: 'User' }, action: String, target_type: String, target_id: ObjectId, details: Mixed }, { timestamps }),
};
schemas.Session.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

export const User = mongoose.models.User || mongoose.model('User', userSchema);
export const models = Object.fromEntries(Object.entries(schemas).map(([name, schema]) => [
  name,
  mongoose.models[name] || mongoose.model(name, schema),
]));
export const collectionModels: Record<string, mongoose.Model<Record<string, unknown>>> = {
  profiles: User,
  products: models.Product,
  demands: models.Demand,
  orders: models.Order,
  order_items: models.OrderItem,
  wishlists: models.Wishlist,
  notifications: models.Notification,
  reviews: models.Review,
  reports: models.Report,
  audit_logs: models.AuditLog,
  demand_responses: models.DemandResponse,
  product_requests: models.ProductRequest,
};
