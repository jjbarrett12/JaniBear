'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, FileText, AlertTriangle, Calendar } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface SDSSheet {
  id: string;
  product_name: string;
  manufacturer: string | null;
  version: string | null;
  issue_date: string | null;
  expiration_date: string | null;
  document_url: string;
  ai_summary: string | null;
  ai_key_hazards: string[] | null;
  is_active: boolean;
}

interface SDSListProps {
  sdsSheets: SDSSheet[];
}

export function SDSList({ sdsSheets: initialSheets }: SDSListProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSheets = initialSheets.filter((sheet) => {
    const matchesSearch =
      !searchTerm ||
      sheet.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sheet.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  const isExpired = (expDate: string | null) => {
    if (!expDate) return false;
    return new Date(expDate) < new Date();
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Search SDS sheets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-14"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {filteredSheets.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No SDS sheets found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredSheets.map((sheet) => (
            <Link key={sheet.id} href={`/app/admin/sds/${sheet.id}`}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{sheet.product_name}</h3>
                        {sheet.manufacturer && (
                          <span className="text-sm text-gray-600">by {sheet.manufacturer}</span>
                        )}
                        {isExpired(sheet.expiration_date) && (
                          <Badge className="bg-red-100 text-red-800">
                            <AlertTriangle className="h-4 w-4 mr-1" />
                            Expired
                          </Badge>
                        )}
                      </div>
                      {sheet.ai_summary && (
                        <p className="text-gray-700 mb-3 line-clamp-2">
                          {sheet.ai_summary}
                        </p>
                      )}
                      {sheet.ai_key_hazards && sheet.ai_key_hazards.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {sheet.ai_key_hazards.slice(0, 3).map((hazard, idx) => (
                            <Badge key={idx} variant="outline" className="bg-orange-50 text-orange-800">
                              {hazard}
                            </Badge>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        {sheet.issue_date && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            Issued: {formatDate(sheet.issue_date)}
                          </div>
                        )}
                        {sheet.expiration_date && (
                          <div className={`flex items-center gap-1 ${isExpired(sheet.expiration_date) ? 'text-red-600 font-semibold' : ''}`}>
                            <Calendar className="h-4 w-4" />
                            Expires: {formatDate(sheet.expiration_date)}
                          </div>
                        )}
                        {sheet.version && (
                          <span>Version: {sheet.version}</span>
                        )}
                      </div>
                    </div>
                    <FileText className="h-8 w-8 text-blue-600 ml-4" />
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
