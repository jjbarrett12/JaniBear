'use client';

import { Check, X, Minus } from 'lucide-react';
import {
  COMPARISON_COLUMNS,
  COMPARISON_ROWS,
  type ComparisonValue,
} from '@/lib/why-janibear-comparison';

function CellValue({ value }: { value: ComparisonValue }) {
  if (value === 'yes') {
    return (
      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400" aria-label="Yes">
        <Check className="h-4 w-4" strokeWidth={2.5} />
      </span>
    );
  }
  if (value === 'no') {
    return (
      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-zinc-700/50 text-zinc-500" aria-label="No">
        <X className="h-4 w-4" strokeWidth={2.5} />
      </span>
    );
  }
  if (value === 'partial') {
    return (
      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-500/15 text-amber-400" aria-label="Partial">
        <Minus className="h-4 w-4" strokeWidth={2.5} />
      </span>
    );
  }
  return <span className="text-sm text-zinc-400">{value}</span>;
}

export function ComparisonTable() {
  const columnIds = COMPARISON_COLUMNS.map((c) => c.id);

  return (
    <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md">
      <table className="w-full min-w-[720px] text-left" role="table" aria-label="JANIBEAR vs competitors comparison">
        <thead>
          <tr className="border-b border-white/10">
            <th scope="col" className="py-4 px-4 text-xs font-semibold uppercase tracking-wider text-zinc-500 w-[220px]">
              Capability
            </th>
            {COMPARISON_COLUMNS.map((col) => (
              <th
                key={col.id}
                scope="col"
                className={`py-4 px-4 text-sm font-semibold text-center min-w-[100px] ${
                  col.isJaniBear ? 'bg-indigo-500/10 text-indigo-300' : 'text-zinc-300'
                }`}
              >
                <span className="block">{col.name}</span>
                {col.description && (
                  <span className="block text-xs font-normal text-zinc-500 mt-0.5">{col.description}</span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {COMPARISON_ROWS.map((row, i) => (
            <tr
              key={`${row.category}-${row.feature}-${i}`}
              className="border-b border-white/5 hover:bg-white/[0.03] transition-colors"
            >
              <td className="py-3.5 px-4">
                <span className="text-xs font-medium uppercase tracking-wider text-zinc-500 block mb-0.5">
                  {row.category}
                </span>
                <span className="text-sm font-medium text-white">{row.feature}</span>
              </td>
              {columnIds.map((colId) => (
                <td key={colId} className="py-3.5 px-4 text-center">
                  <CellValue value={row.values[colId] ?? 'no'} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
