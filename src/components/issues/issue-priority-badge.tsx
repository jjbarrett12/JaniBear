'use client';

interface IssuePriorityBadgeProps {
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export function IssuePriorityBadge({ priority }: IssuePriorityBadgeProps) {
  const variants = {
    low: 'bg-gray-100 text-gray-700 border-gray-300',
    medium: 'bg-blue-100 text-blue-700 border-blue-300',
    high: 'bg-amber-100 text-amber-700 border-amber-300',
    critical: 'bg-red-100 text-red-700 border-red-300',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${variants[priority]}`}
    >
      {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </span>
  );
}
