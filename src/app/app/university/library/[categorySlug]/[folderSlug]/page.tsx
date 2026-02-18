import { requireOrg } from '@/lib/auth';
import { canWriteOrg } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { UniversityFolderContent } from './university-folder-content';

export default async function UniversityFolderPage({
  params,
}: {
  params: Promise<{ categorySlug: string; folderSlug: string }>;
}) {
  const { categorySlug, folderSlug } = await params;
  const org = await requireOrg();
  const canEdit = await canWriteOrg(org.org_id);
  const supabase = await createClient();

  const { data: category } = await supabase
    .from('university_categories')
    .select('id, name, slug')
    .eq('org_id', org.org_id)
    .eq('slug', categorySlug)
    .single();

  if (!category) notFound();

  const { data: folder } = await supabase
    .from('university_folders')
    .select('id, name, slug')
    .eq('category_id', category.id)
    .eq('slug', folderSlug)
    .single();

  if (!folder) notFound();

  const { data: media } = await supabase
    .from('university_media')
    .select('id, type, title, file_path, mime_type, created_at')
    .eq('folder_id', folder.id)
    .order('sort_order');

  const bucket = 'university-uploads';
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}`
    : '';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href={`/app/university/library/${category.slug}`}
          className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          {category.name}
        </Link>
      </div>
      <div>
        <h1 className="text-2xl font-bold text-foreground">{folder.name}</h1>
        <p className="text-muted-foreground">Photos, videos, and documents for training.</p>
      </div>
      <UniversityFolderContent
        orgId={org.org_id}
        folderId={folder.id}
        categorySlug={category.slug}
        folderSlug={folder.slug}
        media={media ?? []}
        baseUrl={baseUrl}
        canEdit={canEdit}
      />
    </div>
  );
}
