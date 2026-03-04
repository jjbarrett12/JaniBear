import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ContactRequestStatusSelect } from '@/components/pro-gear/contact-request-status-select';

export default async function ProGearContactRequestsPage() {
  const supabase = await createClient();
  const { data: requests } = await supabase
    .from('pro_gear_contact_requests')
    .select('*')
    .order('created_at', { ascending: false });

  const list = requests ?? [];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Large opportunity requests</h1>
      <p className="text-sm text-muted-foreground">
        Submitted via &quot;Request to be contacted&quot; on the Pro Gear storefront.
      </p>
      {list.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No requests yet.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {list.map((r: { id: string; contact_name: string; email: string; company_name: string | null; phone: string | null; estimated_quantity: string | null; estimated_value_cents: number | null; message: string | null; status: string; created_at: string }) => (
            <Card key={r.id}>
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <CardTitle className="text-base">{r.contact_name}</CardTitle>
                <ContactRequestStatusSelect requestId={r.id} currentStatus={r.status} />
              </CardHeader>
              <CardContent className="text-sm space-y-1">
                <p><span className="text-muted-foreground">Email:</span> {r.email}</p>
                {r.company_name && (
                  <p><span className="text-muted-foreground">Company:</span> {r.company_name}</p>
                )}
                {r.phone && (
                  <p><span className="text-muted-foreground">Phone:</span> {r.phone}</p>
                )}
                {r.estimated_quantity && (
                  <p><span className="text-muted-foreground">Est. quantity:</span> {r.estimated_quantity}</p>
                )}
                {r.estimated_value_cents != null && (
                  <p><span className="text-muted-foreground">Est. value:</span> ${(r.estimated_value_cents / 100).toLocaleString()}</p>
                )}
                {r.message && (
                  <p className="mt-2"><span className="text-muted-foreground">Message:</span> {r.message}</p>
                )}
                <p className="text-muted-foreground text-xs pt-2">
                  {new Date(r.created_at).toLocaleString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
