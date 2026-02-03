'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Sparkles, 
  Loader2, 
  MapPin,
  Clock,
  Building2,
  ArrowRight,
  AlertTriangle,
  Lightbulb
} from 'lucide-react';

interface Location {
  name: string;
  address?: string;
  square_footage?: number;
  service_days?: string[];
  service_time?: string;
  frequency?: string;
  special_requirements?: string;
}

interface CrewAssignment {
  crew_id: string;
  crew_name: string;
  locations: Array<{
    location_name: string;
    service_days?: string[];
    estimated_hours?: number;
    notes?: string;
  }>;
  total_sqft: number;
  total_hours_per_week: number;
  workload_score?: number;
}

interface SplitResult {
  assignments: CrewAssignment[];
  summary?: string;
  recommendations?: string[];
  warnings?: string[];
}

interface CrewSplitterProps {
  locations: Location[];
}

export function CrewSplitter({ locations }: CrewSplitterProps) {
  const [numCrews, setNumCrews] = useState(2);
  const [optimizeFor, setOptimizeFor] = useState<'balanced' | 'geographic' | 'efficiency'>('balanced');
  const [isSplitting, setIsSplitting] = useState(false);
  const [result, setResult] = useState<SplitResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSplit = async () => {
    if (locations.length === 0) {
      setError('No locations to split');
      return;
    }

    setIsSplitting(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/split-crews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locations,
          numCrews,
          optimizeFor,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to split crews');
      }

      setResult(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to split crews');
    } finally {
      setIsSplitting(false);
    }
  };

  const getWorkloadColor = (score: number = 50) => {
    if (score < 40) return 'bg-yellow-100 text-yellow-700';
    if (score > 80) return 'bg-red-100 text-red-700';
    return 'bg-emerald-100 text-emerald-700';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-violet-500" />
            AI Crew Splitter
          </CardTitle>
          <CardDescription>
            Automatically distribute {locations.length} locations across your cleaning crews
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="numCrews">Number of Crews</Label>
              <Input
                id="numCrews"
                type="number"
                min={1}
                max={20}
                value={numCrews}
                onChange={(e) => setNumCrews(parseInt(e.target.value) || 2)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="optimizeFor">Optimize For</Label>
              <select
                id="optimizeFor"
                value={optimizeFor}
                onChange={(e) => setOptimizeFor(e.target.value as any)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="balanced">Balanced Workload</option>
                <option value="geographic">Geographic Clustering</option>
                <option value="efficiency">Maximum Efficiency</option>
              </select>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <Button 
            onClick={handleSplit} 
            disabled={isSplitting || locations.length === 0}
            className="w-full"
          >
            {isSplitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Optimizing Crew Assignments...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Split Across {numCrews} Crews
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <div className="space-y-4">
          {/* Summary */}
          {result.summary && (
            <div className="bg-violet-50 border border-violet-200 rounded-lg p-4">
              <p className="text-violet-800">{result.summary}</p>
            </div>
          )}

          {/* Crew Assignments */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {result.assignments.map((crew) => (
              <Card key={crew.crew_id} className="overflow-hidden">
                <CardHeader className="pb-3 bg-gradient-to-r from-violet-500 to-purple-500 text-white">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{crew.crew_name}</CardTitle>
                    {crew.workload_score !== undefined && (
                      <Badge className={getWorkloadColor(crew.workload_score)}>
                        {crew.workload_score}% load
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-1.5 text-gray-600">
                      <MapPin className="h-4 w-4" />
                      <span>{crew.locations.length} locations</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-600">
                      <Building2 className="h-4 w-4" />
                      <span>{crew.total_sqft.toLocaleString()} sqft</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-600 col-span-2">
                      <Clock className="h-4 w-4" />
                      <span>{crew.total_hours_per_week.toFixed(1)} hrs/week</span>
                    </div>
                  </div>

                  {/* Locations */}
                  <div className="space-y-2">
                    <Label className="text-xs text-gray-500 uppercase tracking-wide">Assigned Locations</Label>
                    <div className="space-y-1.5 max-h-40 overflow-y-auto">
                      {crew.locations.map((loc, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm p-2 bg-gray-50 rounded">
                          <ArrowRight className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">{loc.location_name}</p>
                            {loc.service_days && loc.service_days.length > 0 && (
                              <p className="text-xs text-gray-500">{loc.service_days.join(', ')}</p>
                            )}
                          </div>
                          {loc.estimated_hours && (
                            <span className="text-xs text-gray-500 shrink-0">
                              {loc.estimated_hours.toFixed(1)}h
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Recommendations */}
          {result.recommendations && result.recommendations.length > 0 && (
            <Card className="border-blue-200 bg-blue-50/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2 text-blue-800">
                  <Lightbulb className="h-5 w-5" />
                  Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1">
                  {result.recommendations.map((rec, i) => (
                    <li key={i} className="text-sm text-blue-700 flex items-start gap-2">
                      <span className="text-blue-400">•</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Warnings */}
          {result.warnings && result.warnings.length > 0 && (
            <Card className="border-amber-200 bg-amber-50/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2 text-amber-800">
                  <AlertTriangle className="h-5 w-5" />
                  Warnings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1">
                  {result.warnings.map((warn, i) => (
                    <li key={i} className="text-sm text-amber-700 flex items-start gap-2">
                      <span className="text-amber-400">•</span>
                      {warn}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
