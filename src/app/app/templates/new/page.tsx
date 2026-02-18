import { redirect } from 'next/navigation';
import { requireOrg } from '@/lib/auth';
import { TemplateBuilder } from '@/components/templates/template-builder';

export default async function NewTemplatePage() {
  await requireOrg();

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">New Template</h1>
        <p className="text-muted-foreground mt-1">Build your inspection form</p>
      </div>
      <TemplateBuilder />
    </div>
  );
}
