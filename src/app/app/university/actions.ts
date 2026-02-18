'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { getCurrentUserId } from '@/lib/auth';
import { canWriteOrg } from '@/lib/auth';

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

export async function createUniversityCategory(orgId: string, name: string) {
  const userId = await getCurrentUserId();
  if (!userId) return { error: 'Not authenticated' };
  if (!(await canWriteOrg(orgId))) return { error: 'Not allowed to manage training library' };
  const slug = slugify(name) || 'category';
  const supabase = await createClient();
  const { data: categories } = await supabase
    .from('university_categories')
    .select('sort_order')
    .eq('org_id', orgId)
    .order('sort_order', { ascending: false })
    .limit(1);
  const sortOrder = (categories?.[0]?.sort_order ?? 0) + 1;
  const { error } = await supabase.from('university_categories').insert({
    org_id: orgId,
    name: name.trim(),
    slug,
    sort_order: sortOrder,
  });
  if (error) return { error: error.message };
  revalidatePath('/app/university');
  revalidatePath('/app/university/manage');
  return {};
}

export async function createUniversityFolder(orgId: string, categoryId: string, name: string) {
  const userId = await getCurrentUserId();
  if (!userId) return { error: 'Not authenticated' };
  if (!(await canWriteOrg(orgId))) return { error: 'Not allowed to manage training library' };
  const slug = slugify(name) || 'folder';
  const supabase = await createClient();
  const { data: folders } = await supabase
    .from('university_folders')
    .select('sort_order')
    .eq('category_id', categoryId)
    .order('sort_order', { ascending: false })
    .limit(1);
  const sortOrder = (folders?.[0]?.sort_order ?? 0) + 1;
  const { error } = await supabase.from('university_folders').insert({
    org_id: orgId,
    category_id: categoryId,
    name: name.trim(),
    slug,
    sort_order: sortOrder,
  });
  if (error) return { error: error.message };
  revalidatePath('/app/university');
  revalidatePath('/app/university/manage');
  revalidatePath(`/app/university/library`);
  return {};
}
