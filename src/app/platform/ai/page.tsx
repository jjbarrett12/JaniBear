import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';

export default function PlatformAIPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">AI Control Center</h1>
        <p className="text-muted-foreground mt-1">Global defaults, per-org overrides, module toggles, usage</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            AI settings
          </CardTitle>
          <CardDescription>Configure global AI defaults and per-org overrides (coming soon)</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Use API or future UI for AI module toggles and usage.</p>
        </CardContent>
      </Card>
    </div>
  );
}
