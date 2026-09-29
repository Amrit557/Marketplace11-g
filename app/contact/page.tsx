import Link from 'next/link';
import { ArrowLeft, Mail } from 'lucide-react';

export default function ContactPage() {
  const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL;
  return (
    <main className="min-h-screen bg-[#f5f7f4] text-[#101513]">
      <header className="border-b border-[#101513]/10">
        <div className="mx-auto flex h-[70px] max-w-3xl items-center justify-between px-5">
          <Link href="/" className="font-mono text-sm font-black">KRAFTO</Link>
          <Link href="/legal/grievance" className="text-xs font-bold underline">Grievance process</Link>
        </div>
      </header>
      <section className="mx-auto max-w-2xl px-5 py-14">
        <Link href="/" className="text-xs font-bold text-[#68746c]"><ArrowLeft className="mr-1 inline" size={14} /> Back to marketplace</Link>
        <div className="eyebrow mt-8">CONTACT / SUPPORT</div>
        <h1 className="mt-4 font-mono text-4xl font-black tracking-[-.06em]">How can we help?</h1>
        <p className="mt-4 text-sm leading-6 text-[#68746c]">For order, privacy, safety, business-verification, or intellectual-property concerns, include the related reference and the support team can route it appropriately. Never send passwords or full payment-card details.</p>
        <div className="mt-7 rounded-lg border-2 border-[#101513] bg-white p-5">
          <Mail size={20} />
          {supportEmail ? (
            <a className="mt-3 inline-block font-bold underline" href={`mailto:${supportEmail}`}>{supportEmail}</a>
          ) : (
            <p className="mt-3 text-sm font-bold">Support email is not configured yet.</p>
          )}
          {!supportEmail && <p className="mt-2 text-xs leading-5 text-[#68746c]">Set NEXT_PUBLIC_SUPPORT_EMAIL to publish the monitored support contact before launch.</p>}
        </div>
        <p className="mt-5 text-xs text-[#68746c]">The final grievance contact, responsible officer details, and response timelines must be verified and published before production launch.</p>
      </section>
    </main>
  );
}
