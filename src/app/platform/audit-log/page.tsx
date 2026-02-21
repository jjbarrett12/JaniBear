import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';

export default async function PlatformAuditLogPage() {
  const supabase = await createClient();
  const { data: logs } = await supabase
    .from('platform_audit_log')
    .select('id, actor_user_id, action, meta, created_at')
    .order('created_at', { ascending: false })
    .limit(50);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Audit Log</h1>
        <p className="text-muted-foreground mt-1">Platform admin actions</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Recent actions
          </CardTitle>
          <CardDescription>platform_audit_log</CardDescription>
        </CardHeader>
        <CardContent>
          {!logs?.length ? (
            <p className="text-muted-foreground text-sm">No entries yet.</p>
          ) : (
            <ul className="divide-y divide-border text-sm">
              {logs.map((log) => (
                <li key={log.id} className="py-2 flex items-center gap-4">
                  <span className="text-muted-foreground shrink-0">{new Date(log.created_at).toISOString()}</span>
                  <span className="font-medium">{log.action}</span>
                  {log.actor_user_id ? <span className="font-mono text-muted-foreground">{log.actor_user_id.slice(0, 8)}…</span> : null}
                  {log.meta ? <span className="truncate text-muted-foreground">{JSON.stringify(log.meta)}</span> : null}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
