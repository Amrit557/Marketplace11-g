# Krafto Marketplace

India-first creator marketplace built with Next.js, TypeScript, Tailwind CSS, MongoDB Atlas, and Mongoose.

## Local setup

1. Install dependencies with `npm install`.
2. For a **display-only local demo**, copy `.env.example` to `.env.local` (or skip this; demo mode is the development default) and run `npm run dev`. No MongoDB connection or session secret is needed. The browser stores demo accounts and interactions locally.
3. Sign in from the demo login chooser using any displayed role and the shared password `KraftoDemo!2026`. Use **Reset demo data** in the banner to restore the initial browser-local examples.
4. The display demo is enabled by default, including on Vercel production builds, and uses browser-local sample data with backend API routes disabled. In Vercel, redeploy the latest commit to publish this default. To use the database-backed application instead, explicitly set `NEXT_PUBLIC_DEMO_MODE=false`, configure `MONGODB_URI` and a `SESSION_SECRET` of at least 32 characters in the hosting environment, and redeploy. Configure Atlas network access and database credentials outside source control.
6. Optionally configure `PLATFORM_COMMISSION_BPS`, `CHECKOUT_TAX_BPS`, and `NEXT_PUBLIC_SUPPORT_EMAIL`.
7. Bootstrap a database-backed administrator once with `BOOTSTRAP_ADMIN_EMAIL` and `BOOTSTRAP_ADMIN_PASSWORD` (minimum 16 characters) set in the environment, then run `npm run create-admin`. The command refuses to overwrite an existing account.
8. To load display-only sample records into a **development database only**, set `DEMO_SEED_ALLOW=YES` and run `npm run seed-demo`. The command refuses to run with `NODE_ENV=production` and refuses to overwrite accounts that are not marked as demo-seeded.

Authentication uses password hashes and an HTTP-only, signed session cookie. MongoDB access is server-side; browser code calls role-checked Next.js route handlers. The Mongoose schemas are created by the application. Configure Atlas network access and database credentials outside source control.

## Integration status

Checkout revalidates prices on the server and records an accepted, pending order with product and seller snapshots. A pending order is not a payment: checkout does not charge buyers, mark orders paid, or create fake payment identifiers. A payment provider adapter, verified webhook handling, private object storage, malware scanning, secure digital delivery, payout settlement, business document storage, and production email delivery must be integrated before those flows are enabled. Do not use demo storefront copy as production inventory or transaction data.

The displayed policies are implementation drafts, not legal advice. Before launch, have the final entity, transaction structure, tax treatment, payout arrangements, and policies reviewed by an appropriate Indian CA/CS/lawyer. Configure the applicable tax, commission, refund, eligibility, age, and retention rules for the actual business model.

The included authentication-attempt limiter is process-local; deploy a shared rate limiter at the edge/API gateway for a multi-instance production deployment. Admin two-factor authentication, secure file storage/scanning, transaction settlement, refunds, payouts, and production grievance email are also launch blockers.

### Display demo accounts

The browser demo includes these accounts with the shared password `KraftoDemo!2026`:

| Role | Demo username |
| --- | --- |
| Buyer | `buyer@krafto-demo.test` |
| Creator | `creator@krafto-demo.test` |
| Verified business (simulated) | `business@krafto-demo.test` |
| Pending business (simulated) | `pending-business@krafto-demo.test` |
| Admin | `admin@krafto-demo.test` |

These are public demo credentials, not secure accounts. Demo data and changes are stored only in the current browser's local storage; use **Reset demo data** on the demo banner to restore the initial sample. The database seeder is a separate optional tool for a disposable development database. Never use real user data or enable demo mode on an installation connected to a production database. Business verification, order counts, ratings, and sales shown in demo mode are illustrative only; there are no verification documents, payments, or downloads. Demo checkout can create pending sample orders only; it never marks them paid or creates payment records.

## MVP phase status

This repository is not a production-complete MVP. The current implementation has working application routes and server-side authorization for several marketplace workflows, but the final acceptance flows are **not end-to-end complete**.

| Phase | Status |
| --- | --- |
| 1. Project foundation | Partial: Next.js, TypeScript, Tailwind, Mongoose, and environment configuration are present. Atlas connectivity and production logging/operations must be configured and verified per deployment. |
| 2. Authentication and roles | Partial: registration, login, logout, role selection, and policy acceptance exist. Email verification and password reset are not implemented. |
| 3. User profiles | Partial: profile editing and role dashboards exist. Secure image upload and complete notification preferences are not implemented. |
| 4. Marketplace core | Partial: product discovery, creator submissions, and moderation exist. Secure product media storage and scanning are not implemented; products without a verified safe delivery asset cannot be published. |
| 5. Creator dashboard | Partial: product management and basic sales views exist. Real sales, revenue settlement, and payouts are unavailable. |
| 6. Business verification | Partial: verification status and admin decisions exist. Secure document submission and review are not implemented. |
| 7. Business demand system | Partial: demand submission, moderation, and creator responses exist; a response creates a product draft. |
| 8. Buyer shopping flow | Partial: cart, server-priced checkout, accepted pending orders, order history, and order line-item snapshots exist. Pending orders are not paid orders. |
| 9. Payment integration | Incomplete: no payment provider, verified webhook, payment status transition, or refund integration is configured. |
| 10. Delivery and creator earnings | Incomplete: secure downloads, transaction settlement, and payouts are unavailable. |
| 11. Reviews and trust | Partial: purchase-gated reviews and reporting foundations exist; dispute handling, copyright workflows, and complete risk controls are unavailable. |
| 12. Opportunity and sales growth | Partial: buyer product requests provide demand signals; matching and recommendations are not complete. |
| 13. Notifications | Partial: in-app notification foundations exist. Production email delivery and complete event coverage are unavailable. |
| 14. Admin panel | Partial: account, product, demand, report, and audit workflows exist. Payment/refund/payout operations and several other requested admin workflows are unavailable. |
| 15. Legal and compliance | Incomplete: policy pages are drafts and require review by qualified Indian legal and tax professionals for the actual business. |
| 16. Security and production audit | Incomplete: deployment-specific security, incident response, backup/recovery, and end-to-end malicious-input testing remain launch requirements. |

Consequently, the buyer, creator, business, and admin acceptance flows must not be described as complete until the missing integrations and operational checks above are implemented and tested.
