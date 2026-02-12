'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Edit, Trash2, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { LOCALE_LABELS } from '@/lib/survey-translations';

interface Employee {
  id: string;
  employee_number: string | null;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  status: string;
  role: string;
  department: string | null;
  position: string | null;
  photo_url: string | null;
  language_preference: string;
  hire_date: string | null;
}

interface EmployeeListProps {
  employees: Employee[];
}

export function EmployeeList({ employees: initialEmployees }: EmployeeListProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredEmployees = initialEmployees.filter((emp) => {
    const matchesSearch =
      !searchTerm ||
      `${emp.first_name} ${emp.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.employee_number?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || emp.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'terminated':
        return 'bg-red-100 text-red-800';
      case 'on_leave':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      case 'manager':
        return 'bg-blue-100 text-blue-800';
      case 'supervisor':
        return 'bg-indigo-100 text-indigo-800';
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
                placeholder="Search employees..."
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
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="on_leave">On Leave</SelectItem>
                <SelectItem value="terminated">Terminated</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {filteredEmployees.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No employees found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEmployees.map((employee) => (
            <Card key={employee.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {employee.photo_url ? (
                      <Image
                        src={employee.photo_url}
                        alt={`${employee.first_name} ${employee.last_name}`}
                        width={48}
                        height={48}
                        className="rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                        <User className="h-6 w-6 text-gray-400" />
                      </div>
                    )}
                    <div>
                      <div className="font-semibold text-lg">
                        {employee.first_name} {employee.last_name}
                      </div>
                      {employee.employee_number && (
                        <div className="text-sm text-gray-500">
                          #{employee.employee_number}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/app/admin/employees/${employee.id}/edit`}>
                      <Button variant="ghost" size="icon">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  {employee.email && (
                    <div className="text-sm text-gray-600">{employee.email}</div>
                  )}
                  {employee.phone && (
                    <div className="text-sm text-gray-600">{employee.phone}</div>
                  )}
                  {employee.position && (
                    <div className="text-sm font-medium">{employee.position}</div>
                  )}
                  {employee.department && (
                    <div className="text-sm text-gray-500">{employee.department}</div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge className={getStatusColor(employee.status)}>
                    {employee.status}
                  </Badge>
                  <Badge className={getRoleColor(employee.role)}>
                    {employee.role}
                  </Badge>
                  {employee.language_preference && (
                    <Badge variant="outline">
                      {LOCALE_LABELS[employee.language_preference as keyof typeof LOCALE_LABELS] ?? employee.language_preference.toUpperCase()}
                    </Badge>
                  )}
                </div>

                <div className="flex gap-2">
                  <Link href={`/app/admin/employees/${employee.id}`} className="flex-1">
                    <Button variant="outline" className="w-full">
                      View Details
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
