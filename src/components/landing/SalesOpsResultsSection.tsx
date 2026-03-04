'use client';

export function SalesOpsResultsSection() {
  return (
    <section className="relative py-20">
      <div className="mx-auto max-w-6xl px-6">
        {/* Header — neon anchor */}
        <div className="text-center">
          <div className="inline-flex items-center rounded-full border border-amber-500/50 bg-amber-500/10 px-4 py-1 text-xs font-semibold tracking-wide text-amber-300">
            RESULTS
          </div>

          <h2 className="mt-5 font-heading text-4xl md:text-5xl font-semibold tracking-tight text-white">
            Sales Wins Contracts. Ops Keeps Them.
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-400">
            JANIBEAR connects bidding + delivery so you don&apos;t win jobs you can&apos;t run—or lose jobs you already earned.
          </p>
        </div>

        {/* Sales — amber-highlighted cards, yellow label */}
        <div className="mt-12">
          <div className="mb-5 flex items-center justify-center">
            <span className="inline-flex items-center rounded-full border border-amber-400/60 bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-300">
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

        {/* Ops — amber-highlighted cards, green label */}
        <div className="mt-10">
          <div className="mb-5 flex items-center justify-center">
            <span className="inline-flex items-center rounded-full border border-emerald-400/60 bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-300">
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
    <div
      className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)] transition-all duration-300 hover:-translate-y-1 hover:border-indigo-400/40"
    >
      <div className="flex items-center justify-center">
        <div className="flex size-12 items-center justify-center rounded-xl border border-indigo-400/20 bg-indigo-500/10 text-lg">
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
