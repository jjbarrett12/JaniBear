'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Calendar, AlertCircle, CheckCircle, XCircle, Clock } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface ComplianceRecord {
  id: string;
  type: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  completion_date: string | null;
  locations: { name: string } | null;
  employees: { first_name: string; last_name: string } | null;
  ai_suggestions: any;
}

interface ComplianceListProps {
  records: ComplianceRecord[];
}

export function ComplianceList({ records: initialRecords }: ComplianceListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const filteredRecords = initialRecords.filter((record) => {
    const matchesSearch =
      !searchTerm ||
      record.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || record.status === statusFilter;
    const matchesType = typeFilter === 'all' || record.type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant':
        return 'bg-green-100 text-green-800';
      case 'non_compliant':
        return 'bg-red-100 text-red-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'expired':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'compliant':
        return <CheckCircle className="h-4 w-4" />;
      case 'non_compliant':
        return <XCircle className="h-4 w-4" />;
      case 'in_progress':
        return <Clock className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeLabel = (type: string) => {
    return type
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date() && new Date(dueDate).toDateString() !== new Date().toDateString();
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Search compliance records..."
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
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="compliant">Compliant</SelectItem>
                <SelectItem value="non_compliant">Non-Compliant</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="h-14 w-full md:w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="safety">Safety</SelectItem>
                <SelectItem value="health">Health</SelectItem>
                <SelectItem value="environmental">Environmental</SelectItem>
                <SelectItem value="training">Training</SelectItem>
                <SelectItem value="certification">Certification</SelectItem>
                <SelectItem value="inspection">Inspection</SelectItem>
                <SelectItem value="audit">Audit</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {filteredRecords.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No compliance records found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredRecords.map((record) => (
            <Link key={record.id} href={`/app/admin/compliance/${record.id}`}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{record.title}</h3>
                        <Badge className={getStatusColor(record.status)}>
                          <span className="flex items-center gap-1">
                            {getStatusIcon(record.status)}
                            {record.status.replace('_', ' ')}
                          </span>
                        </Badge>
                        <Badge className={getPriorityColor(record.priority)}>
                          {record.priority}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                        <span className="font-medium">{getTypeLabel(record.type)}</span>
                        {record.locations && (
                          <span>• Location: {record.locations.name}</span>
                        )}
                        {record.employees && (
                          <span>
                            • Assigned: {record.employees.first_name}{' '}
                            {record.employees.last_name}
                          </span>
                        )}
                      </div>
                      {record.description && (
                        <p className="text-gray-700 mb-3 line-clamp-2">
                          {record.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-sm">
                        {record.due_date && (
                          <div
                            className={`flex items-center gap-1 ${
                              isOverdue(record.due_date) ? 'text-red-600 font-semibold' : 'text-gray-600'
                            }`}
                          >
                            <Calendar className="h-4 w-4" />
                            Due: {formatDate(record.due_date)}
                            {isOverdue(record.due_date) && ' (Overdue)'}
                          </div>
                        )}
                        {record.completion_date && (
                          <div className="flex items-center gap-1 text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            Completed: {formatDate(record.completion_date)}
                          </div>
                        )}
                      </div>
                      {record.ai_suggestions && (
                        <div className="mt-3 p-2 bg-blue-50 rounded text-sm text-blue-800">
                          <span className="font-medium">AI Suggestions Available</span>
                        </div>
                      )}
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
