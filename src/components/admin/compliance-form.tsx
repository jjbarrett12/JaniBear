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
import { Sparkles } from 'lucide-react';

const complianceSchema = z.object({
  type: z.enum(['safety', 'health', 'environmental', 'training', 'certification', 'inspection', 'audit']),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  status: z.enum(['pending', 'in_progress', 'compliant', 'non_compliant', 'expired']),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  due_date: z.string().optional(),
  location_id: z.string().optional(),
  assigned_to: z.string().optional(),
});

type ComplianceFormData = z.infer<typeof complianceSchema>;

interface ComplianceFormProps {
  compliance?: any;
  locations: Array<{ id: string; name: string }>;
  employees: Array<{ id: string; first_name: string; last_name: string }>;
}

export function ComplianceForm({ compliance, locations, employees }: ComplianceFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ComplianceFormData>({
    resolver: zodResolver(complianceSchema),
    defaultValues: compliance
      ? {
          type: compliance.type || 'safety',
          title: compliance.title || '',
          description: compliance.description || '',
          status: compliance.status || 'pending',
          priority: compliance.priority || 'medium',
          due_date: compliance.due_date || '',
          location_id: compliance.location_id || '',
          assigned_to: compliance.assigned_to || '',
        }
      : {
          type: 'safety',
          title: '',
          description: '',
          status: 'pending',
          priority: 'medium',
          due_date: '',
          location_id: '',
          assigned_to: '',
        },
  });

  const generateAISuggestions = async () => {
    const formData = watch();
    if (!formData.title || !formData.type) {
      toast({
        title: 'Error',
        description: 'Please fill in title and type first',
        variant: 'destructive',
      });
      return;
    }

    setIsGeneratingAI(true);
    try {
      const response = await fetch('/api/ai/compliance-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: formData.type,
          title: formData.title,
          description: formData.description,
        }),
      });

      if (!response.ok) throw new Error('AI service unavailable');

      const { suggestions } = await response.json();

      if (suggestions && suggestions.length > 0) {
        const aiText = `\n\nAI Suggestions:\n${suggestions.join('\n')}`;
        setValue('description', (formData.description || '') + aiText);
        toast({
          title: 'AI Suggestions Generated',
          description: 'AI recommendations have been added to the description',
        });
      }
    } catch (error: any) {
      console.error('AI generation error:', error);
      toast({
        title: 'AI Service Unavailable',
        description: 'AI suggestions are not available. You can continue without them.',
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const onSubmit = async (data: ComplianceFormData) => {
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

      const complianceData = {
        org_id: orgMember.org_id,
        type: data.type,
        title: data.title,
        description: data.description || null,
        status: data.status,
        priority: data.priority,
        due_date: data.due_date || null,
        location_id: data.location_id || null,
        assigned_to: data.assigned_to || null,
        created_by: user.id,
      };

      if (compliance) {
        const { error } = await supabase
          .from('compliance_records')
          .update(complianceData)
          .eq('id', compliance.id);

        if (error) throw error;
        toast({
          title: 'Compliance record updated',
          description: 'Compliance record has been updated successfully.',
        });
      } else {
        const { error } = await supabase
          .from('compliance_records')
          .insert(complianceData);

        if (error) throw error;
        toast({
          title: 'Compliance record created',
          description: 'New compliance record has been created successfully.',
        });
      }

      router.push('/app/admin/compliance');
      router.refresh();
    } catch (error: any) {
      console.error('Error saving compliance:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save compliance record',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Compliance Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="type">
                Type <span className="text-red-500">*</span>
              </Label>
              <Select
                value={watch('type')}
                onValueChange={(value) => setValue('type', value as any)}
              >
                <SelectTrigger className="h-14">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
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
            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={watch('priority')}
                onValueChange={(value) => setValue('priority', value as any)}
              >
                <SelectTrigger className="h-14">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="title">
                Title <span className="text-red-500">*</span>
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={generateAISuggestions}
                disabled={isGeneratingAI}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                {isGeneratingAI ? 'Generating...' : 'Get AI Suggestions'}
              </Button>
            </div>
            <Input
              id="title"
              {...register('title')}
              className="h-14"
              placeholder="e.g., Annual Safety Training"
            />
            {errors.title && (
              <p className="text-sm text-red-500 mt-1">{errors.title.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Describe the compliance requirement..."
              className="min-h-[120px]"
            />
          </div>

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
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="compliant">Compliant</SelectItem>
                  <SelectItem value="non_compliant">Non-Compliant</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="due_date">Due Date</Label>
              <Input
                id="due_date"
                type="date"
                {...register('due_date')}
                className="h-14"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="location_id">Location (Optional)</Label>
              <Select
                value={watch('location_id') || ''}
                onValueChange={(value) => setValue('location_id', value || undefined)}
              >
                <SelectTrigger className="h-14">
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {locations.map((loc) => (
                    <SelectItem key={loc.id} value={loc.id}>
                      {loc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="assigned_to">Assign To (Optional)</Label>
              <Select
                value={watch('assigned_to') || ''}
                onValueChange={(value) => setValue('assigned_to', value || undefined)}
              >
                <SelectTrigger className="h-14">
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.first_name} {emp.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button
          type="submit"
          size="lg"
          className="h-14 text-lg flex-1"
          disabled={isSubmitting}
        >
          {isSubmitting
            ? 'Saving...'
            : compliance
            ? 'Update Compliance Record'
            : 'Create Compliance Record'}
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
