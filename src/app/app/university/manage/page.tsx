import { requireOrg } from '@/lib/auth';
import { canWriteOrg } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, FolderOpen, Layers } from 'lucide-react';
import { UniversityManageForms } from './university-manage-forms';

export default async function UniversityManagePage() {
  const org = await requireOrg();
  const canEdit = await canWriteOrg(org.org_id);
  if (!canEdit) redirect('/app/university');

  const supabase = await createClient();
  const { data: categories } = await supabase
    .from('university_categories')
    .select('id, name, slug, sort_order')
    .eq('org_id', org.org_id)
    .order('sort_order');

  const folderMap: Record<string, { id: string; name: string; slug: string }[]> = {};
  if (categories?.length) {
    const { data: folders } = await supabase
      .from('university_folders')
      .select('id, category_id, name, slug')
      .in('category_id', categories.map((c) => c.id))
      .order('sort_order');
    folders?.forEach((f) => {
      if (!folderMap[f.category_id]) folderMap[f.category_id] = [];
      folderMap[f.category_id].push({ id: f.id, name: f.name, slug: f.slug });
    });
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link
          href="/app/university"
          className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Training & University
        </Link>
      </div>
      <div>
        <h1 className="text-2xl font-bold text-foreground">Manage training library</h1>
        <p className="text-muted-foreground">
          Add categories and folders. Upload photos and videos from each folder page.
        </p>
      </div>

      <UniversityManageForms orgId={org.org_id} categories={categories ?? []} />

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Categories & folders</h2>
        <div className="space-y-4">
          {categories?.map((cat) => (
            <Card key={cat.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                    <Layers className="h-4 w-4 text-amber-700 dark:text-amber-300" />
                  </div>
                  <CardTitle className="text-base">{cat.name}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {(folderMap[cat.id] ?? []).map((folder) => (
                    <li key={folder.id} className="flex items-center gap-2">
                      <FolderOpen className="h-4 w-4 text-muted-foreground" />
                      <Link
                        href={`/app/university/library/${cat.slug}/${folder.slug}`}
                        className="text-sm text-amber-600 dark:text-amber-400 hover:underline"
                      >
                        {folder.name}
                      </Link>
                      <span className="text-muted-foreground text-xs">— upload here</span>
                    </li>
                  ))}
                  {(!folderMap[cat.id] || folderMap[cat.id].length === 0) && (
                    <li className="text-sm text-muted-foreground">No folders yet. Add one below.</li>
                  )}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
        {(!categories || categories.length === 0) && (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No categories yet. Add your first category above.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
