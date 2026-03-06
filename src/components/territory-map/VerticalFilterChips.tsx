'use client';

interface VerticalOption {
  id: string;
  key: string;
  label: string;
}

interface Props {
  verticals: VerticalOption[];
  selectedIds: Set<string>;
  onToggle: (verticalId: string, selected: boolean) => void;
  showVerticalOwnership: boolean;
  onShowVerticalOwnershipChange: (value: boolean) => void;
}

const VERTICAL_PALETTE = ['#eab308', '#3b82f6', '#22c55e', '#a855f7', '#ef4444', '#06b6d4', '#f97316', '#ec4899'];

export function VerticalFilterChips({
  verticals,
  selectedIds,
  onToggle,
  showVerticalOwnership,
  onShowVerticalOwnershipChange,
}: Props) {
  if (verticals.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-zinc-500">Vertical:</span>
      {verticals.map((v, i) => {
        const selected = selectedIds.has(v.id);
        const color = VERTICAL_PALETTE[i % VERTICAL_PALETTE.length];
        return (
          <button
            key={v.id}
            type="button"
            onClick={() => onToggle(v.id, !selected)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
              selected
                ? 'border-white/30 bg-white/15 text-white'
                : 'border-white/10 bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-zinc-300'
            }`}
            title={selected ? `Hide ${v.label}` : `Show only ${v.label}`}
          >
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: color }}
              aria-hidden
            />
            {v.label}
          </button>
        );
      })}
      <label className="ml-2 flex items-center gap-1.5 text-xs text-zinc-400">
        <input
          type="checkbox"
          checked={showVerticalOwnership}
          onChange={(e) => onShowVerticalOwnershipChange(e.target.checked)}
          className="rounded border-white/20 bg-white/5 text-amber-500 focus:ring-amber-500/50"
        />
        Show vertical ownership
      </label>
    </div>
  );
}

/** Export palette for use in MapCanvas lead marker coloring */
export const VERTICAL_COLORS = VERTICAL_PALETTE;
