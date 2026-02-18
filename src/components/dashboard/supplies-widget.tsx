'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, Truck, Users, ShoppingCart, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { formatCurrency } from '@/lib/utils';

export interface SuppliesWidgetProps {
  vendorsCount: number;
  productsCount: number;
  clientsCount: number;
  recentOrders: Array<{
    id: string;
    po_number?: string;
    status?: string;
    total_amount?: number;
    vendor_name?: string;
  }>;
}

export function SuppliesWidget({
  vendorsCount,
  productsCount,
  clientsCount,
  recentOrders,
}: SuppliesWidgetProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.55, duration: 0.4 }}
    >
      <Card className="border-0 shadow-md hover:shadow-lg transition-shadow h-full dark:bg-gray-800">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600 shadow-md">
                <Package className="h-5 w-5 text-white" />
              </div>
              <CardTitle className="text-lg font-semibold text-foreground dark:text-white">
                Supplies
              </CardTitle>
            </div>
            <Link
              href="/app/supplies"
              className="text-sm font-medium text-teal-600 dark:text-teal-400 hover:underline"
            >
              View all
            </Link>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Vendors, products & orders
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Mini stats */}
          <div className="grid grid-cols-3 gap-2">
            <Link href="/app/supplies/vendors">
              <div className="flex flex-col items-center p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <Truck className="h-4 w-4 text-blue-500 mb-1" />
                <span className="text-lg font-bold text-foreground dark:text-white">{vendorsCount}</span>
                <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wide">Vendors</span>
              </div>
            </Link>
            <Link href="/app/supplies/products">
              <div className="flex flex-col items-center p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <Package className="h-4 w-4 text-emerald-500 mb-1" />
                <span className="text-lg font-bold text-foreground dark:text-white">{productsCount}</span>
                <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wide">Products</span>
              </div>
            </Link>
            <Link href="/app/supplies/customers">
              <div className="flex flex-col items-center p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <Users className="h-4 w-4 text-violet-500 mb-1" />
                <span className="text-lg font-bold text-foreground dark:text-white">{clientsCount}</span>
                <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wide">Customers</span>
              </div>
            </Link>
          </div>

          {/* Recent orders */}
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
              Recent orders
            </p>
            {recentOrders.length > 0 ? (
              <div className="space-y-1">
                {recentOrders.slice(0, 3).map((order) => (
                  <Link key={order.id} href={`/app/admin/purchase-orders/${order.id}`}>
                    <div className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group">
                      <div className="flex items-center gap-2 min-w-0">
                        <ShoppingCart className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                        <span className="text-sm font-medium text-foreground dark:text-white truncate group-hover:text-teal-600 dark:group-hover:text-teal-400">
                          {order.po_number || 'PO'}
                        </span>
                        <Badge
                          variant="secondary"
                          className={`text-[10px] shrink-0 ${
                            order.status === 'delivered'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                              : order.status === 'ordered'
                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                          }`}
                        >
                          {order.status || 'pending'}
                        </Badge>
                      </div>
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-300 shrink-0 ml-2">
                        {formatCurrency(order.total_amount || 0)}
                      </span>
                      <ArrowRight className="h-3.5 w-3.5 text-gray-400 shrink-0 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">No orders yet</p>
                <Link href="/app/supplies/orders/new">
                  <span className="text-sm font-medium text-teal-600 dark:text-teal-400 hover:underline">
                    Create order
                  </span>
                </Link>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
