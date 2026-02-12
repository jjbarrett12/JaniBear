import { redirect, notFound } from 'next/navigation';
import { requireOrg } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import Image from 'next/image';
import { Edit, User, Mail, Phone, Calendar, DollarSign, Languages } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { LOCALE_LABELS } from '@/lib/survey-translations';
import type { Locale } from '@/lib/survey-translations';

export default async function EmployeeDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const org = await requireOrg();
  const supabase = await createClient();

  // Fetch employee
  const { data: employee } = await supabase
    .from('employees')
    .select('*')
    .eq('id', params.id)
    .eq('org_id', org.org_id)
    .single();

  if (!employee) {
    notFound();
  }

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {employee.first_name} {employee.last_name}
          </h1>
          {employee.employee_number && (
            <p className="text-gray-600 mt-1">#{employee.employee_number}</p>
          )}
        </div>
        <Link href={`/app/admin/employees/${employee.id}/edit`}>
          <Button size="lg" className="h-14 text-lg">
            <Edit className="h-5 w-5 mr-2" />
            Edit Employee
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-gray-400" />
                <div>
                  <div className="text-sm text-gray-500">Full Name</div>
                  <div className="font-medium">
                    {employee.first_name} {employee.last_name}
                  </div>
                </div>
              </div>
              {employee.email && (
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-500">Email</div>
                    <div className="font-medium">{employee.email}</div>
                  </div>
                </div>
              )}
              {employee.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-500">Phone</div>
                    <div className="font-medium">{employee.phone}</div>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3">
                <Languages className="h-5 w-5 text-gray-400" />
                <div>
                  <div className="text-sm text-gray-500">Language Preference</div>
                  <div className="font-medium">
                    {employee.language_preference ? (LOCALE_LABELS[employee.language_preference as Locale] ?? employee.language_preference) : '—'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Employment Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {employee.position && (
                <div>
                  <div className="text-sm text-gray-500">Position</div>
                  <div className="font-medium">{employee.position}</div>
                </div>
              )}
              {employee.department && (
                <div>
                  <div className="text-sm text-gray-500">Department</div>
                  <div className="font-medium">{employee.department}</div>
                </div>
              )}
              {employee.hourly_rate && (
                <div className="flex items-center gap-3">
                  <DollarSign className="h-5 w-5 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-500">Hourly Rate</div>
                    <div className="font-medium">
                      ${employee.hourly_rate.toFixed(2)}/hour
                    </div>
                  </div>
                </div>
              )}
              {employee.hire_date && (
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-500">Hire Date</div>
                    <div className="font-medium">
                      {formatDate(employee.hire_date)}
                    </div>
                  </div>
                </div>
              )}
              {employee.termination_date && (
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-500">Termination Date</div>
                    <div className="font-medium">
                      {formatDate(employee.termination_date)}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {employee.emergency_contact_name && (
            <Card>
              <CardHeader>
                <CardTitle>Emergency Contact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm text-gray-500">Contact Name</div>
                  <div className="font-medium">{employee.emergency_contact_name}</div>
                </div>
                {employee.emergency_contact_phone && (
                  <div>
                    <div className="text-sm text-gray-500">Contact Phone</div>
                    <div className="font-medium">{employee.emergency_contact_phone}</div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {employee.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-wrap">{employee.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Status & Role</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm text-gray-500 mb-2">Status</div>
                <Badge className={getStatusColor(employee.status)}>
                  {employee.status}
                </Badge>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-2">Role</div>
                <Badge className={getRoleColor(employee.role)}>
                  {employee.role}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {employee.photo_url && (
            <Card>
              <CardHeader>
                <CardTitle>Photo</CardTitle>
              </CardHeader>
              <CardContent>
                <Image
                  src={employee.photo_url}
                  alt={`${employee.first_name} ${employee.last_name}`}
                  width={200}
                  height={200}
                  className="w-full h-64 object-cover rounded-lg"
                />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
