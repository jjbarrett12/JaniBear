'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronRight, Building2, Puzzle, Store } from 'lucide-react';

export type BusinessModel = 'owner-operator' | 'area-franchisor' | 'unit-franchisee';

const MODELS: Array<{
  id: BusinessModel;
  title: string;
  subtitle: string;
  bullets: string[];
  icon: React.ElementType;
  accent: string;
}> = [
  {
    id: 'owner-operator',
    title: 'Owner / Operator Company',
    subtitle: 'Independent janitorial companies with crews',
    bullets: ['Sales + Ops + Employees', 'Local or regional', 'Hands-on ownership'],
    icon: Building2,
    accent: 'amber',
  },
  {
    id: 'area-franchisor',
    title: 'Area Franchisor',
    subtitle: 'Sales + brand oversight, no crews',
    bullets: [
      'Lead management',
      'Sales enablement',
      'Franchise performance visibility',
    ],
    icon: Puzzle,
    accent: 'blue',
  },
  {
    id: 'unit-franchisee',
    title: 'Unit Franchisee',
    subtitle: 'Owner/operators running crews under a brand',
    bullets: ['Sales + Ops execution', 'Corporate reporting', 'Employee accountability'],
    icon: Store,
    accent: 'violet',
  },
];

const accentClasses: Record<string, string> = {
  amber:
    'border-amber-400/40 hover:border-amber-400/70 bg-amber-500/5 hover:bg-amber-500/10 [&_.icon-wrap]:bg-amber-500/20 [&_.icon-wrap]:text-amber-400',
  blue: 'border-blue-400/40 hover:border-blue-400/70 bg-blue-500/5 hover:bg-blue-500/10 [&_.icon-wrap]:bg-blue-500/20 [&_.icon-wrap]:text-blue-400',
  violet:
    'border-violet-400/40 hover:border-violet-400/70 bg-violet-500/5 hover:bg-violet-500/10 [&_.icon-wrap]:bg-violet-500/20 [&_.icon-wrap]:text-violet-400',
};

interface BusinessModelSelectorProps {
  onSelect: (model: BusinessModel) => void;
}

export function BusinessModelSelector({ onSelect }: BusinessModelSelectorProps) {
  return (
    <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
      {MODELS.map((model) => {
        const Icon = model.icon;
        return (
          <Card
            key={model.id}
            className={`cursor-pointer transition-all duration-200 border-2 ${accentClasses[model.accent]} group`}
            onClick={() => onSelect(model.id)}
          >
            <CardContent className="p-6 flex flex-col h-full">
              <div className="icon-wrap w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-1">{model.title}</h3>
              <p className="text-sm text-zinc-400 mb-4">{model.subtitle}</p>
              <ul className="space-y-1.5 text-sm text-zinc-400 mb-6 flex-1">
                {model.bullets.map((b, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
                    {b}
                  </li>
                ))}
              </ul>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-center text-zinc-200 hover:text-white hover:bg-white/5 border border-zinc-700 hover:border-zinc-600 -mb-2 -mx-2"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(model.id);
                }}
              >
                View Plans
                <ChevronRight className="ml-1 h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
