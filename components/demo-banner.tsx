'use client';

import { DEMO_MODE } from '@/lib/demo-mode';
import { resetDemoData } from '@/lib/demo-api';

export function DemoBanner() {
  if (!DEMO_MODE) return null;
  return (
    <div className="sticky top-0 z-[100] flex flex-wrap items-center justify-center gap-x-4 gap-y-1 border-b border-[#9a5b00] bg-[#fff1c2] px-4 py-2 text-center font-mono text-[10px] font-bold tracking-wide text-[#684000] md:text-xs">
      <span>DEMO ONLY · Sample accounts and marketplace content · No real verification, payment, sale, or download</span>
      <button type="button" onClick={resetDemoData} className="underline underline-offset-2">Reset demo data</button>
    </div>
  );
}
