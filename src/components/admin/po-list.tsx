'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Calendar, Package, DollarSign } from 'lucide-react';
import { formatDate, formatCurrency } from '@/lib/utils';

interface PurchaseOrder {
  id: string;
  po_number: string;
  supplier_name: string;
  order_date: string;
  expected_delivery_date: string | null;
  status: string;
  total_amount: number;
  currency: string;
}

interface POListProps {
  purchaseOrders: PurchaseOrder[];
}

export function POList({ purchaseOrders: initialPOs }: POListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredPOs = initialPOs.filter((po) => {
    const matchesSearch =
      !searchTerm ||
      po.po_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      po.supplier_name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || po.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'in_transit':
        return 'bg-blue-100 text-blue-800';
      case 'ordered':
        return 'bg-purple-100 text-purple-800';
      case 'approved':
        return 'bg-indigo-100 text-indigo-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Search purchase orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-14"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-14 w-full md:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="ordered">Ordered</SelectItem>
                <SelectItem value="in_transit">In Transit</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {filteredPOs.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No purchase orders found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredPOs.map((po) => (
            <Link key={po.id} href={`/app/admin/purchase-orders/${po.id}`}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{po.po_number}</h3>
                        <Badge className={getStatusColor(po.status)}>
                          {po.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                        <span className="font-medium">{po.supplier_name}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1 text-gray-600">
                          <Calendar className="h-4 w-4" />
                          Ordered: {formatDate(po.order_date)}
                        </div>
                        {po.expected_delivery_date && (
                          <div className="flex items-center gap-1 text-gray-600">
                            <Package className="h-4 w-4" />
                            Expected: {formatDate(po.expected_delivery_date)}
                          </div>
                        )}
                        <div className="flex items-center gap-1 text-foreground font-semibold">
                          <DollarSign className="h-4 w-4" />
                          {formatCurrency(po.total_amount)}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
