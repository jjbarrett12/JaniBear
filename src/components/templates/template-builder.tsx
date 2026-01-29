'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GripVertical, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

interface TemplateItem {
  id?: string;
  label: string;
  item_type: 'pass_fail' | 'rating_1_5' | 'numeric' | 'text' | 'yes_no' | 'task_checklist';
  weight: number;
  is_required: boolean;
  instructions?: string;
  sort_order: number;
}

interface TemplateSection {
  id?: string;
  title: string;
  sort_order: number;
  items: TemplateItem[];
}

interface TemplateBuilderProps {
  initialData?: {
    template: {
      id: string;
      name: string;
      description?: string;
      is_active: boolean;
    };
    sections: Array<{
      id: string;
      title: string;
      sort_order: number;
      template_items: Array<{
        id: string;
        label: string;
        item_type: string;
        weight: number;
        is_required: boolean;
        instructions?: string;
        sort_order: number;
      }>;
    }>;
  };
}

export function TemplateBuilder({ initialData }: TemplateBuilderProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [templateName, setTemplateName] = useState(initialData?.template.name || '');
  const [templateDescription, setTemplateDescription] = useState(initialData?.template.description || '');
  const [isActive, setIsActive] = useState(initialData?.template.is_active ?? true);
  
  const [sections, setSections] = useState<TemplateSection[]>(() => {
    if (initialData?.sections) {
      return initialData.sections.map((s) => ({
        id: s.id,
        title: s.title,
        sort_order: s.sort_order,
        items: s.template_items.map((item) => ({
          id: item.id,
          label: item.label,
          item_type: item.item_type as TemplateItem['item_type'],
          weight: item.weight,
          is_required: item.is_required,
          instructions: item.instructions || '',
          sort_order: item.sort_order,
        })),
      }));
    }
    return [];
  });

  const addSection = () => {
    setSections([
      ...sections,
      {
        title: `Section ${sections.length + 1}`,
        sort_order: sections.length,
        items: [],
      },
    ]);
  };

  const updateSection = (index: number, field: keyof TemplateSection, value: any) => {
    const updated = [...sections];
    updated[index] = { ...updated[index], [field]: value };
    setSections(updated);
  };

  const deleteSection = (index: number) => {
    setSections(sections.filter((_, i) => i !== index).map((s, i) => ({
      ...s,
      sort_order: i,
    })));
  };

  const moveSection = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === sections.length - 1) return;
    
    const updated = [...sections];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    updated[index].sort_order = index;
    updated[newIndex].sort_order = newIndex;
    setSections(updated);
  };

  const addItem = (sectionIndex: number) => {
    const updated = [...sections];
    updated[sectionIndex].items.push({
      label: 'New Item',
      item_type: 'pass_fail',
      weight: 1,
      is_required: false,
      sort_order: updated[sectionIndex].items.length,
    });
    setSections(updated);
  };

  const updateItem = (sectionIndex: number, itemIndex: number, field: keyof TemplateItem, value: any) => {
    const updated = [...sections];
    updated[sectionIndex].items[itemIndex] = {
      ...updated[sectionIndex].items[itemIndex],
      [field]: value,
    };
    setSections(updated);
  };

  const deleteItem = (sectionIndex: number, itemIndex: number) => {
    const updated = [...sections];
    updated[sectionIndex].items = updated[sectionIndex].items
      .filter((_, i) => i !== itemIndex)
      .map((item, i) => ({ ...item, sort_order: i }));
    setSections(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      setError('You must be logged in');
      setIsLoading(false);
      return;
    }

    const { data: membership } = await supabase
      .from('org_members')
      .select('org_id')
      .eq('user_id', user.id)
      .limit(1)
      .single();

    if (!membership) {
      setError('You must belong to an organization');
      setIsLoading(false);
      return;
    }

    try {
      let templateId = initialData?.template.id;

      if (initialData?.template.id) {
        // Update template
        const { error: updateError } = await supabase
          .from('templates')
          .update({
            name: templateName,
            description: templateDescription || null,
            is_active: isActive,
          })
          .eq('id', templateId);

        if (updateError) throw updateError;

        // Delete existing sections and items (will recreate)
        await supabase.from('template_items').delete().in('template_section_id', 
          sections.filter(s => s.id).map(s => s.id!)
        );
        await supabase.from('template_sections').delete().eq('template_id', templateId);
      } else {
        // Create template
        const { data: template, error: insertError } = await supabase
          .from('templates')
          .insert({
            org_id: membership.org_id,
            name: templateName,
            description: templateDescription || null,
            is_active: isActive,
          })
          .select()
          .single();

        if (insertError) throw insertError;
        templateId = template.id;
      }

      // Create sections and items
      for (const section of sections) {
        const { data: sectionData, error: sectionError } = await supabase
          .from('template_sections')
          .insert({
            org_id: membership.org_id,
            template_id: templateId,
            title: section.title,
            sort_order: section.sort_order,
          })
          .select()
          .single();

        if (sectionError) throw sectionError;

        if (section.items.length > 0) {
          const itemsToInsert = section.items.map((item) => ({
            org_id: membership.org_id,
            template_section_id: sectionData.id,
            label: item.label,
            item_type: item.item_type,
            weight: item.weight,
            is_required: item.is_required,
            instructions: item.instructions || null,
            sort_order: item.sort_order,
          }));

          const { error: itemsError } = await supabase
            .from('template_items')
            .insert(itemsToInsert);

          if (itemsError) throw itemsError;
        }
      }

      router.push('/app/templates');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Failed to save template');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Template Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Template Name *</Label>
            <Input
              id="name"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={templateDescription}
              onChange={(e) => setTemplateDescription(e.target.value)}
              disabled={isLoading}
              rows={3}
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              disabled={isLoading}
              className="rounded"
            />
            <Label htmlFor="is_active">Active</Label>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Sections</h2>
          <Button type="button" onClick={addSection} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add Section
          </Button>
        </div>

        {sections.map((section, sectionIndex) => (
          <Card key={sectionIndex}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <GripVertical className="h-5 w-5 text-gray-400" />
                <Input
                  value={section.title}
                  onChange={(e) => updateSection(sectionIndex, 'title', e.target.value)}
                  className="flex-1 font-semibold"
                  disabled={isLoading}
                />
                <div className="flex gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => moveSection(sectionIndex, 'up')}
                    disabled={sectionIndex === 0 || isLoading}
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => moveSection(sectionIndex, 'down')}
                    disabled={sectionIndex === sections.length - 1 || isLoading}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteSection(sectionIndex)}
                    disabled={isLoading}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addItem(sectionIndex)}
                  disabled={isLoading}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>

              {section.items.map((item, itemIndex) => (
                <div key={itemIndex} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-4 w-4 text-gray-400" />
                    <Input
                      value={item.label}
                      onChange={(e) => updateItem(sectionIndex, itemIndex, 'label', e.target.value)}
                      placeholder="Item label"
                      className="flex-1"
                      disabled={isLoading}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteItem(sectionIndex, itemIndex)}
                      disabled={isLoading}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Type</Label>
                      <Select
                        value={item.item_type}
                        onValueChange={(value) => updateItem(sectionIndex, itemIndex, 'item_type', value)}
                        disabled={isLoading}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pass_fail">Pass/Fail</SelectItem>
                          <SelectItem value="rating_1_5">Rating 1-5</SelectItem>
                          <SelectItem value="yes_no">Yes/No</SelectItem>
                          <SelectItem value="numeric">Numeric</SelectItem>
                          <SelectItem value="text">Text</SelectItem>
                          <SelectItem value="task_checklist">Task Checklist</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Weight</Label>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        value={item.weight}
                        onChange={(e) => updateItem(sectionIndex, itemIndex, 'weight', parseFloat(e.target.value) || 1)}
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={item.is_required}
                      onChange={(e) => updateItem(sectionIndex, itemIndex, 'is_required', e.target.checked)}
                      disabled={isLoading}
                      className="rounded"
                    />
                    <Label className="text-xs">Required</Label>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Instructions (optional)</Label>
                    <Textarea
                      value={item.instructions || ''}
                      onChange={(e) => updateItem(sectionIndex, itemIndex, 'instructions', e.target.value)}
                      placeholder="Additional instructions for this item"
                      rows={2}
                      disabled={isLoading}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      {error && (
        <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
          {error}
        </div>
      )}

      <div className="flex gap-2">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : initialData ? 'Update Template' : 'Create Template'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isLoading}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
