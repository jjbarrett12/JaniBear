'use client';

export function SalesOpsResultsSection() {
  return (
    <section className="relative py-20 border-t border-white/10 bg-black">
      <div className="mx-auto max-w-6xl px-6">
        {/* Header — neon anchor */}
        <div className="text-center">
          <div className="inline-flex items-center rounded-full border border-amber-500/50 bg-amber-500/10 px-4 py-1 text-xs font-semibold tracking-wide text-amber-300">
            RESULTS
          </div>

          <h2 className="mt-5 text-4xl font-extrabold tracking-tight text-amber-300 drop-shadow-[0_0_18px_rgba(250,204,21,0.35)] md:text-5xl">
            Sales Wins Contracts. Ops Keeps Them.
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-base text-zinc-400 md:text-lg">
            JANIBEAR connects bidding + delivery so you don&apos;t win jobs you can&apos;t run—or lose jobs you already earned.
          </p>
        </div>

        {/* Sales — calm cards */}
        <div className="mt-12">
          <div className="mb-5 flex items-center justify-center">
            <span className="inline-flex items-center rounded-full border border-zinc-600/80 bg-zinc-900/60 px-3 py-1 text-xs font-semibold text-zinc-300">
              SALES
            </span>
          </div>

          <div className="grid gap-6 md:grid-cols-4">
            <ResultCard icon="⚡" headline="Same-day" label="Proposal delivery" sub="Before you leave the property" />
            <ResultCard icon="📈" headline="40%" label="Higher close rate" sub="With automated follow-ups" />
            <ResultCard icon="⏱️" headline="75%" label="Time saved per proposal" sub="From 2 hours to 30 minutes" />
            <ResultCard icon="🧾" headline="3x" label="More proposals sent" sub="Same team, more opportunities" />
          </div>
        </div>

        {/* Ops — calm cards */}
        <div className="mt-10">
          <div className="mb-5 flex items-center justify-center">
            <span className="inline-flex items-center rounded-full border border-zinc-600/80 bg-zinc-900/60 px-3 py-1 text-xs font-semibold text-zinc-300">
              OPERATIONS
            </span>
          </div>

          <div className="grid gap-6 md:grid-cols-4">
            <ResultCard icon="🛡️" headline="Fewer" label="Complaints" sub="Catch issues before clients do" />
            <ResultCard icon="✅" headline="Higher" label="Inspection completion" sub="Proof of work, every site" />
            <ResultCard icon="🗺️" headline="Full" label="Coverage confidence" sub="Know what got cleaned—nightly" />
            <ResultCard icon="🔔" headline="Lower" label="Renewal risk" sub="Trends + alerts reduce churn" />
          </div>
        </div>
      </div>
    </section>
  );
}

function ResultCard({
  icon,
  headline,
  label,
  sub,
}: {
  icon: string;
  headline: string;
  label: string;
  sub: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
      <div className="flex items-center justify-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-lg">
          {icon}
        </div>
      </div>

      <div className="mt-5 text-center">
        <div className="text-2xl font-bold text-white">{headline}</div>
        <div className="mt-2 text-sm font-medium text-zinc-300">{label}</div>
        <div className="mt-1 text-sm text-zinc-500">{sub}</div>
      </div>
    </div>
  );
}
