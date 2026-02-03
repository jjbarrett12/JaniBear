import { createClient } from '@/lib/supabase/server';
import { requireOrg } from '@/lib/auth';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Truck, 
  ArrowLeft,
  Star,
  Mail,
  Phone,
  MapPin,
  ArrowRight
} from 'lucide-react';

export default async function VendorsPage() {
  const org = await requireOrg();
  const supabase = await createClient();

  const { data: vendors } = await supabase
    .from('vendors')
    .select('*')
    .eq('org_id', org.org_id)
    .order('is_preferred', { ascending: false })
    .order('name', { ascending: true });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/app/supplies" className="p-2 rounded-lg hover:bg-gray-100">
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Vendors</h1>
          <p className="text-gray-600">Manage your suppliers and their details</p>
        </div>
        <Link href="/app/supplies/vendors/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Vendor
          </Button>
        </Link>
      </div>

      {/* Vendors List */}
      {vendors && vendors.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {vendors.map((vendor) => (
            <Link key={vendor.id} href={`/app/supplies/vendors/${vendor.id}`}>
              <Card className="hover:shadow-md transition-all cursor-pointer h-full group">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-100">
                        <Truck className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900 group-hover:text-blue-600">
                            {vendor.name}
                          </h3>
                          {vendor.is_preferred && (
                            <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                          )}
                        </div>
                        {vendor.contact_name && (
                          <p className="text-sm text-gray-500">{vendor.contact_name}</p>
                        )}
                      </div>
                    </div>
                    <Badge variant={vendor.is_active ? 'default' : 'secondary'}>
                      {vendor.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>

                  <div className="space-y-2 text-sm text-gray-600">
                    {vendor.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span className="truncate">{vendor.email}</span>
                      </div>
                    )}
                    {vendor.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span>{vendor.phone}</span>
                      </div>
                    )}
                    {vendor.ship_to_city && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span>{vendor.ship_to_city}, {vendor.ship_to_state}</span>
                      </div>
                    )}
                  </div>

                  {vendor.account_number && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-xs text-gray-500">
                        Account: <span className="font-medium">{vendor.account_number}</span>
                      </p>
                    </div>
                  )}

                  <div className="mt-3 flex items-center justify-end">
                    <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-blue-500" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-16 text-center">
            <Truck className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No vendors yet</h3>
            <p className="text-gray-500 mb-6">Add your first vendor to start managing your supply chain</p>
            <Link href="/app/supplies/vendors/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Vendor
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
