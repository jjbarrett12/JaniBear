import { createClient } from '@/lib/supabase/server';
import { requireOrg } from '@/lib/auth';
import { notFound } from 'next/navigation';
import { TemplateBuilder } from '@/components/templates/template-builder';

export default async function EditTemplatePage({
  params,
}: {
  params: { id: string };
}) {
  const org = await requireOrg();
  const supabase = await createClient();

  const { data: template } = await supabase
    .from('templates')
    .select('*')
    .eq('id', params.id)
    .eq('org_id', org.org_id)
    .single();

  if (!template) {
    notFound();
  }

  // Load sections and items
  const { data: sections } = await supabase
    .from('template_sections')
    .select('*, template_items(*)')
    .eq('template_id', template.id)
    .order('sort_order');

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Edit Template</h1>
        <p className="text-gray-600 mt-1">Update your inspection form</p>
      </div>
      <TemplateBuilder initialData={{ template, sections: sections || [] }} />
    </div>
  );
}
