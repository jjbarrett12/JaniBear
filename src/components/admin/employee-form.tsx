'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import type { Locale } from '@/lib/survey-translations';
import { LOCALE_LABELS } from '@/lib/survey-translations';
import { Upload, X } from 'lucide-react';
import Image from 'next/image';

const LOCALES: Locale[] = ['en', 'es', 'pt', 'it', 'ru', 'uk', 'zh', 'vi', 'tl', 'fr', 'ar', 'ko'];

const employeeSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  hire_date: z.string().optional(),
  termination_date: z.string().optional(),
  status: z.enum(['active', 'inactive', 'terminated', 'on_leave']),
  role: z.enum(['employee', 'supervisor', 'manager', 'admin']),
  department: z.string().optional(),
  position: z.string().optional(),
  pay_type: z.enum(['hourly', 'salary']),
  hourly_rate: z.string().optional(),
  salary_amount: z.string().optional(),
  language_preference: z.enum(['en', 'es', 'pt', 'it', 'ru', 'uk', 'zh', 'vi', 'tl', 'fr', 'ar', 'ko']),
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
  notes: z.string().optional(),
});

type EmployeeFormData = z.infer<typeof employeeSchema>;

interface EmployeeFormProps {
  employee?: any;
}

export function EmployeeForm({ employee }: EmployeeFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(
    employee?.photo_url || null
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
    defaultValues: employee
      ? {
          first_name: employee.first_name || '',
          last_name: employee.last_name || '',
          email: employee.email || '',
          phone: employee.phone || '',
          hire_date: employee.hire_date || '',
          termination_date: employee.termination_date || '',
          status: employee.status || 'active',
          role: employee.role || 'employee',
          department: employee.department || '',
          position: employee.position || '',
          pay_type: employee.pay_type || 'hourly',
          hourly_rate: employee.hourly_rate?.toString() || '',
          salary_amount: employee.salary_amount?.toString() || '',
          language_preference: employee.language_preference || 'en',
          emergency_contact_name: employee.emergency_contact_name || '',
          emergency_contact_phone: employee.emergency_contact_phone || '',
          notes: employee.notes || '',
        }
      : {
          status: 'active',
          role: 'employee',
          pay_type: 'hourly',
          language_preference: 'en',
        },
  });

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const onSubmit = async (data: EmployeeFormData) => {
    setIsSubmitting(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: orgMember } = await supabase
        .from('org_members')
        .select('org_id')
        .eq('user_id', user.id)
        .single();

      if (!orgMember) throw new Error('Organization not found');

      let photoUrl = employee?.photo_url || null;

      if (photoFile) {
        const fileExt = photoFile.name.split('.').pop();
        const fileName = `${orgMember.org_id}/${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('employee-photos')
          .upload(fileName, photoFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('employee-photos')
          .getPublicUrl(fileName);

        photoUrl = publicUrl;
      }

      const employeeData = {
        org_id: orgMember.org_id,
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email || null,
        phone: data.phone || null,
        hire_date: data.hire_date || null,
        termination_date: data.termination_date || null,
        status: data.status,
        role: data.role,
        department: data.department || null,
        position: data.position || null,
        pay_type: data.pay_type,
        hourly_rate: data.pay_type === 'hourly' && data.hourly_rate ? parseFloat(data.hourly_rate) : null,
        salary_amount: data.pay_type === 'salary' && data.salary_amount ? parseFloat(data.salary_amount) : null,
        language_preference: data.language_preference,
        photo_url: photoUrl,
        emergency_contact_name: data.emergency_contact_name || null,
        emergency_contact_phone: data.emergency_contact_phone || null,
        notes: data.notes || null,
      };

      if (employee) {
        const { error } = await supabase
          .from('employees')
          .update(employeeData)
          .eq('id', employee.id);

        if (error) throw error;
        toast({
          title: 'Employee updated',
          description: 'Employee information has been updated successfully.',
        });
      } else {
        const { error } = await supabase.from('employees').insert(employeeData);

        if (error) throw error;
        toast({
          title: 'Employee created',
          description: 'New employee has been added successfully.',
        });
      }

      router.push('/app/admin/employees');
      router.refresh();
    } catch (error: any) {
      console.error('Error saving employee:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save employee',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={watch('status')}
                    onValueChange={(value) => setValue('status', value as any)}
                  >
                    <SelectTrigger className="h-14">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="on_leave">On Leave</SelectItem>
                      <SelectItem value="terminated">Terminated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first_name">
                    First Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="first_name"
                    {...register('first_name')}
                    className="h-14"
                  />
                  {errors.first_name && (
                    <p className="text-sm text-red-500 mt-1">
                      {errors.first_name.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="last_name">
                    Last Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="last_name"
                    {...register('last_name')}
                    className="h-14"
                  />
                  {errors.last_name && (
                    <p className="text-sm text-red-500 mt-1">
                      {errors.last_name.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    {...register('email')}
                    className="h-14"
                  />
                  {errors.email && (
                    <p className="text-sm text-red-500 mt-1">
                      {errors.email.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    {...register('phone')}
                    className="h-14"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Employment Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="role">Role</Label>
                  <Select
                    value={watch('role')}
                    onValueChange={(value) => setValue('role', value as any)}
                  >
                    <SelectTrigger className="h-14">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="employee">Employee</SelectItem>
                      <SelectItem value="supervisor">Supervisor</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    {...register('department')}
                    className="h-14"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="position">Position</Label>
                  <Input
                    id="position"
                    {...register('position')}
                    className="h-14"
                  />
                </div>
              </div>
              <div className="space-y-4">
                <Label>Pay type</Label>
                <Select
                  value={watch('pay_type')}
                  onValueChange={(v) => setValue('pay_type', v as 'hourly' | 'salary')}
                >
                  <SelectTrigger className="h-14">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hourly">Hourly</SelectItem>
                    <SelectItem value="salary">Salary</SelectItem>
                  </SelectContent>
                </Select>
                {watch('pay_type') === 'hourly' ? (
                  <div>
                    <Label htmlFor="hourly_rate">Hourly rate ($)</Label>
                    <Input
                      id="hourly_rate"
                      type="number"
                      step="0.01"
                      min={0}
                      {...register('hourly_rate')}
                      className="h-14"
                      placeholder="e.g. 18.50"
                    />
                  </div>
                ) : (
                  <div>
                    <Label htmlFor="salary_amount">Annual salary ($)</Label>
                    <Input
                      id="salary_amount"
                      type="number"
                      step="0.01"
                      min={0}
                      {...register('salary_amount')}
                      className="h-14"
                      placeholder="e.g. 42000"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Used in Financial Health for labor cost and cashflow</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="hire_date">Hire Date</Label>
                  <Input
                    id="hire_date"
                    type="date"
                    {...register('hire_date')}
                    className="h-14"
                  />
                </div>
                <div>
                  <Label htmlFor="termination_date">Termination Date</Label>
                  <Input
                    id="termination_date"
                    type="date"
                    {...register('termination_date')}
                    className="h-14"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="language_preference">Language Preference</Label>
                <Select
                  value={watch('language_preference')}
                  onValueChange={(value) =>
                    setValue('language_preference', value as any)
                  }
                >
                  <SelectTrigger className="h-14">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LOCALES.map((loc) => (
                      <SelectItem key={loc} value={loc}>
                        {LOCALE_LABELS[loc]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Emergency Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="emergency_contact_name">Contact Name</Label>
                  <Input
                    id="emergency_contact_name"
                    {...register('emergency_contact_name')}
                    className="h-14"
                  />
                </div>
                <div>
                  <Label htmlFor="emergency_contact_phone">Contact Phone</Label>
                  <Input
                    id="emergency_contact_phone"
                    type="tel"
                    {...register('emergency_contact_phone')}
                    className="h-14"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                {...register('notes')}
                placeholder="Additional notes about this employee..."
                className="min-h-[120px]"
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Photo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {photoPreview ? (
                <div className="relative">
                  <Image
                    src={photoPreview}
                    alt="Employee photo"
                    width={200}
                    height={200}
                    className="w-full h-64 object-cover rounded-lg"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={removePhoto}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-sm text-gray-600 mb-2">Upload employee photo</p>
                  <Label htmlFor="photo" className="cursor-pointer">
                    <Button type="button" variant="outline" asChild>
                      <span>Choose File</span>
                    </Button>
                  </Label>
                  <Input
                    id="photo"
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex gap-4">
        <Button
          type="submit"
          size="lg"
          className="h-14 text-lg flex-1"
          disabled={isSubmitting}
        >
          {isSubmitting
            ? 'Saving...'
            : employee
            ? 'Update Employee'
            : 'Create Employee'}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="h-14 text-lg"
          onClick={() => router.back()}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
