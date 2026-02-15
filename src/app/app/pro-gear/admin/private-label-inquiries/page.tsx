import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { InquiryStatusSelect } from '@/components/pro-gear/admin-inquiry-status-select';

export default async function ProGearPrivateLabelInquiriesPage() {
  const supabase = await createClient();
  const { data: inquiries } = await supabase
    .from('pro_gear_private_label_inquiries')
    .select(
      'id, product_id, user_id, company_name, contact_name, email, phone, estimated_quantity, notes, status, created_at, pro_gear_products(name, slug)'
    )
    .order('created_at', { ascending: false });

  const list = inquiries ?? [];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Private label inquiries</h1>
      <div className="space-y-4">
        {list.length === 0 ? (
          <p className="text-muted-foreground">No inquiries yet.</p>
        ) : (
          list.map(
            (inq: {
              id: string;
              product_id: string;
              company_name: string | null;
              contact_name: string;
              email: string;
              phone: string | null;
              estimated_quantity: number | null;
              notes: string | null;
              status: string;
              created_at: string;
              pro_gear_products: { name: string; slug: string } | null;
            }) => (
              <Card key={inq.id}>
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                  <CardTitle className="text-base">
                    {(inq.pro_gear_products as { name: string })?.name ?? 'Product'}
                  </CardTitle>
                  <InquiryStatusSelect inquiryId={inq.id} currentStatus={inq.status} />
                </CardHeader>
                <CardContent className="text-sm space-y-1">
                  <p>
                    <span className="text-muted-foreground">Contact:</span>{' '}
                    {inq.contact_name} — {inq.email}
                  </p>
                  {inq.company_name && (
                    <p>
                      <span className="text-muted-foreground">Company:</span>{' '}
                      {inq.company_name}
                    </p>
                  )}
                  {inq.phone && (
                    <p>
                      <span className="text-muted-foreground">Phone:</span>{' '}
                      {inq.phone}
                    </p>
                  )}
                  {inq.estimated_quantity != null && (
                    <p>
                      <span className="text-muted-foreground">Est. qty:</span>{' '}
                      {inq.estimated_quantity}
                    </p>
                  )}
                  {inq.notes && (
                    <p>
                      <span className="text-muted-foreground">Notes:</span>{' '}
                      {inq.notes}
                    </p>
                  )}
                  <p className="text-muted-foreground text-xs pt-2">
                    {new Date(inq.created_at).toLocaleString()}
                  </p>
                </CardContent>
              </Card>
            )
          )
        )}
      </div>
    </div>
  );
}
