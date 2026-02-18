import { requireOrg } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, ArrowRight, FolderOpen } from 'lucide-react';

export default async function UniversityCategoryPage({
  params,
}: {
  params: Promise<{ categorySlug: string }>;
}) {
  const { categorySlug } = await params;
  const org = await requireOrg();
  const supabase = await createClient();

  const { data: category } = await supabase
    .from('university_categories')
    .select('id, name, slug')
    .eq('org_id', org.org_id)
    .eq('slug', categorySlug)
    .single();

  if (!category) notFound();

  const { data: folders } = await supabase
    .from('university_folders')
    .select('id, name, slug')
    .eq('category_id', category.id)
    .order('sort_order');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/app/university"
          className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Training library
        </Link>
      </div>
      <div>
        <h1 className="text-2xl font-bold text-foreground">{category.name}</h1>
        <p className="text-muted-foreground">Select a folder to view training materials.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {folders?.map((folder) => (
          <Link key={folder.id} href={`/app/university/library/${category.slug}/${folder.slug}`}>
            <Card className="h-full border hover:border-amber-500/50 transition-colors cursor-pointer group">
              <CardHeader className="pb-2">
                <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30 w-fit">
                  <FolderOpen className="h-5 w-5 text-amber-700 dark:text-amber-300" />
                </div>
                <CardTitle className="text-base group-hover:text-amber-600 dark:group-hover:text-amber-400">
                  {folder.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  Open
                  <ArrowRight className="h-3 w-3" />
                </span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
      {(!folders || folders.length === 0) && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No folders in this category yet. Managers can add folders from Manage categories & uploads.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
