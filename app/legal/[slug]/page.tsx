import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

const policies: Record<string, { title: string; summary: string; sections: [string, string][] }> = {
  terms: {
    title: 'Terms & Conditions',
    summary: 'Draft framework for using the Krafto marketplace.',
    sections: [
      ['Using the marketplace', 'Accounts must use accurate information and comply with applicable law and platform rules. Users must meet the configured minimum-age requirement.'],
      ['Marketplace roles', 'Buyers purchase listings, creators submit original listings for moderation, and businesses may publish public demands only after verification. Verification or moderation is not a guarantee of a transaction.'],
      ['Orders and payments', 'Prices, applicable charges, seller details, delivery terms, and cancellation information must be shown before payment. An order is paid only after server-side confirmation from the configured payment provider.'],
      ['Account actions', 'Users may request account deletion. Platform records may be retained only as required by applicable law, security, and transaction-record obligations.'],
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    summary: 'Draft description of information handling; not a substitute for a final data inventory.',
    sections: [
      ['Information collected', 'The platform may process account, profile, transaction, support, and verification information needed to operate the marketplace. Sensitive business verification, payout, and tax information must remain private.'],
      ['Purpose and access', 'Information should be limited to account operation, marketplace safety, payment processing, legal obligations, and user-requested support. Access should be role-restricted and logged.'],
      ['Retention and rights', 'Retention periods, user requests, consent handling, and deletion exceptions must be configured to match the final service and applicable Indian data-protection obligations.'],
      ['Service providers', 'Payment, hosting, communication, and storage providers must be identified in the production policy before launch.'],
    ],
  },
  refunds: {
    title: 'Refund & Cancellation Policy',
    summary: 'Refund periods and eligibility are configurable and require final legal and operational approval.',
    sections: [
      ['Before payment', 'The checkout must identify the seller, total price, applicable fees or taxes, delivery method, and the product-specific refund and cancellation terms.'],
      ['Digital products', 'Digital delivery and any restrictions on cancellation or refund must be disclosed before purchase and must comply with applicable law. No blanket legal exception is asserted here.'],
      ['Physical products', 'Shipping, dispatch, cancellation, return, and refund conditions must be stated on the listing before purchase.'],
      ['Requests and processing', 'A buyer may request help from the order record. Approved refunds must be processed through the payment provider and reflected in order, payment, ledger, and payout records.'],
    ],
  },
  'creator-terms': {
    title: 'Creator / Seller Terms',
    summary: 'Draft seller agreement framework.',
    sections: [
      ['Rights and content', 'Creators are responsible for obtaining and retaining all rights, permissions, licenses, and releases needed to offer uploaded material.'],
      ['Moderation', 'Submissions remain drafts or under moderation until approved. Approval may be withheld for IP concerns, prohibited content, fraud, misleading claims, unsafe files, or policy violations.'],
      ['Fees and payouts', 'Commission, taxes, payout eligibility, settlement timing, and refund adjustments are configurable and must be disclosed before seller activation. No payout is guaranteed.'],
      ['Files and safety', 'Uploads must meet file-type and size controls. Private storage, scanning, and temporary authorized delivery links are required before digital delivery is enabled.'],
    ],
  },
  'business-terms': {
    title: 'Business Terms',
    summary: 'Draft terms for verified business accounts and demand publication.',
    sections: [
      ['Verification', 'Business information and documents are used for verification and are not intended for public display. Only verified businesses may publish public demands.'],
      ['Genuine demands', 'A business must submit a genuine, sufficiently described requirement and follow moderation and marketplace rules.'],
      ['No purchase commitment', 'Creator responses and linked products do not commit a business to purchase. Any purchase follows the ordinary checkout and order process.'],
      ['Privacy', 'Do not upload unnecessary personal, confidential, or third-party information in a public demand or reference file.'],
    ],
  },
  'intellectual-property': {
    title: 'Intellectual Property & Copyright',
    summary: 'Draft reporting and content-rights framework.',
    sections: [
      ['Creator warranties', 'A creator must have the rights and permissions necessary to list and license each product.'],
      ['Complaints', 'Rights holders should be able to submit a notice identifying the work, the allegedly infringing listing, contact details, and a good-faith statement.'],
      ['Review', 'Reports require human review, a documented decision, an audit trail, and an opportunity to respond where appropriate. Listings may be restricted while a report is reviewed.'],
    ],
  },
  'prohibited-content': {
    title: 'Prohibited Content Policy',
    summary: 'Draft marketplace safety baseline.',
    sections: [
      ['Not allowed', 'Do not list unlawful goods or services, stolen or infringing material, malware, deceptive or fraudulent offers, exploitative content, or content that violates applicable platform rules.'],
      ['Product integrity', 'Descriptions, previews, licenses, file formats, and claims must be accurate. Uploaded files must not contain malware or undisclosed harmful behavior.'],
      ['Enforcement', 'Reports may result in review, removal, account restrictions, or referral where required by law. Decisions and appeals should be recorded in platform audit logs.'],
    ],
  },
  grievance: {
    title: 'Grievance & Support',
    summary: 'Support and grievance process setup.',
    sections: [
      ['Contact', 'Use the Contact page to reach the configured support channel. The production service must publish a monitored grievance contact and applicable response timelines.'],
      ['Include', 'Provide the relevant order, product, demand, or report reference and explain the assistance requested. Do not send passwords, full card details, or unnecessary sensitive documents.'],
      ['Escalation', 'Safety, payment, privacy, and intellectual-property issues should be routed to the appropriate trained reviewer and tracked to resolution.'],
    ],
  },
};

export function generateStaticParams() {
  return Object.keys(policies).map((slug) => ({ slug }));
}

export default function LegalPage({ params }: { params: { slug: string } }) {
  const policy = policies[params.slug];
  if (!policy) notFound();
  return (
    <main className="min-h-screen bg-[#f5f7f4] text-[#101513]">
      <header className="border-b border-[#101513]/10">
        <div className="mx-auto flex h-[70px] max-w-3xl items-center justify-between px-5">
          <Link href="/" className="font-mono text-sm font-black">KRAFTO</Link>
          <Link href="/contact" className="text-xs font-bold underline">Contact / support</Link>
        </div>
      </header>
      <article className="mx-auto max-w-3xl px-5 py-12">
        <Link href="/" className="text-xs font-bold text-[#68746c]"><ArrowLeft className="mr-1 inline" size={14} /> Back to marketplace</Link>
        <div className="eyebrow mt-8">LEGAL / DRAFT FOR REVIEW</div>
        <h1 className="mt-4 font-mono text-4xl font-black tracking-[-.06em]">{policy.title}</h1>
        <p className="mt-3 text-sm text-[#68746c]">{policy.summary}</p>
        <div className="mt-6 rounded border border-[#927100]/30 bg-[#fff4cc] p-4 text-sm leading-6">
          These are implementation-stage policy drafts, not production legal advice. Have the final marketplace entity, payment flow, products, and policies reviewed by an Indian CA/CS/lawyer before launch.
        </div>
        <div className="mt-8 space-y-7">
          {policy.sections.map(([heading, copy]) => (
            <section key={heading} className="border-t border-[#101513]/15 pt-5">
              <h2 className="font-mono text-lg font-black">{heading}</h2>
              <p className="mt-2 text-sm leading-6 text-[#566159]">{copy}</p>
            </section>
          ))}
        </div>
      </article>
    </main>
  );
}
