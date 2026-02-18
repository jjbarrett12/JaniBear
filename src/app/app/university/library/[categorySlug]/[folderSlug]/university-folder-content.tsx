'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Upload, Image, Video, FileText, Trash2, Loader2 } from 'lucide-react';

const ACCEPT_PHOTO = 'image/*';
const ACCEPT_VIDEO = 'video/*';
const ACCEPT_DOC = '.pdf,.doc,.docx';
const MAX_MB = 100;

type MediaType = 'photo' | 'video' | 'document';

interface MediaRow {
  id: string;
  type: string;
  title: string;
  file_path: string;
  mime_type: string | null;
  created_at: string;
}

interface UniversityFolderContentProps {
  orgId: string;
  folderId: string;
  categorySlug: string;
  folderSlug: string;
  media: MediaRow[];
  baseUrl: string;
  canEdit: boolean;
}

export function UniversityFolderContent({
  orgId,
  folderId,
  media,
  baseUrl,
  canEdit,
}: UniversityFolderContentProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const getTypeLabel = (type: string) => {
    if (type === 'photo') return 'Photo';
    if (type === 'video') return 'Video';
    return 'Document';
  };

  const getTypeIcon = (type: string) => {
    if (type === 'photo') return Image;
    if (type === 'video') return Video;
    return FileText;
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const type: MediaType = file.type.startsWith('image/')
      ? 'photo'
      : file.type.startsWith('video/')
        ? 'video'
        : 'document';
    if (file.size > MAX_MB * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: `Maximum size is ${MAX_MB}MB.`,
        variant: 'destructive',
      });
      return;
    }
    setUploading(true);
    try {
      const supabase = createClient();
      const ext = file.name.split('.').pop() || '';
      const safeName = file.name.slice(0, 60).replace(/[^a-zA-Z0-9._-]/g, '_');
      const filePath = `${orgId}/${folderId}/${Date.now()}_${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from('university-uploads')
        .upload(filePath, file, { upsert: false });

      if (uploadError) throw uploadError;

      const title = file.name.replace(/\.[^.]+$/, '');
      const { error: insertError } = await supabase.from('university_media').insert({
        org_id: orgId,
        folder_id: folderId,
        type,
        title,
        file_path: filePath,
        mime_type: file.type,
        file_size: file.size,
        sort_order: media.length,
      });

      if (insertError) throw insertError;

      toast({ title: 'Uploaded', description: `${title} has been added.` });
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      toast({ title: 'Upload failed', description: message, variant: 'destructive' });
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDelete = async (id: string, filePath: string) => {
    if (!confirm('Remove this item from the training folder?')) return;
    setDeletingId(id);
    try {
      const supabase = createClient();
      await supabase.storage.from('university-uploads').remove([filePath]);
      const { error } = await supabase.from('university_media').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Removed', description: 'Item removed from folder.' });
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Delete failed';
      toast({ title: 'Remove failed', description: message, variant: 'destructive' });
    } finally {
      setDeletingId(null);
    }
  };

  const publicUrl = (path: string) => (baseUrl ? `${baseUrl}/${path}` : '');

  return (
    <div className="space-y-6">
      {canEdit && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Add photo or video</CardTitle>
            <p className="text-sm text-muted-foreground">
              Upload images or videos for your team to use as training materials.
            </p>
          </CardHeader>
          <CardContent>
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <Button type="button" variant="outline" disabled={uploading} asChild>
                <span>
                  {uploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  <span className="ml-2">Choose file (photo/video/document)</span>
                </span>
              </Button>
              <input
                type="file"
                className="sr-only"
                accept={`${ACCEPT_PHOTO},${ACCEPT_VIDEO},${ACCEPT_DOC}`}
                onChange={handleUpload}
                disabled={uploading}
              />
            </label>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {media.map((item) => {
          const Icon = getTypeIcon(item.type);
          const url = publicUrl(item.file_path);
          return (
            <Card key={item.id}>
              {item.type === 'photo' && url ? (
                <div className="aspect-video w-full overflow-hidden rounded-t-lg bg-muted">
                  <img
                    src={url}
                    alt={item.title}
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : item.type === 'video' && url ? (
                <div className="aspect-video w-full rounded-t-lg bg-muted">
                  <video
                    src={url}
                    controls
                    className="h-full w-full"
                    preload="metadata"
                  />
                </div>
              ) : (
                <div className="aspect-video w-full rounded-t-lg bg-muted flex items-center justify-center">
                  <Icon className="h-12 w-12 text-muted-foreground" />
                </div>
              )}
              <CardHeader className="py-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-sm font-medium leading-tight">{item.title}</CardTitle>
                  {canEdit && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0 h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(item.id, item.file_path)}
                      disabled={deletingId === item.id}
                    >
                      {deletingId === item.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{getTypeLabel(item.type)}</p>
              </CardHeader>
              {item.type === 'document' && url && (
                <CardContent className="pt-0">
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-amber-600 dark:text-amber-400 hover:underline"
                  >
                    Open file
                  </a>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
      {media.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No photos or videos yet. {canEdit ? 'Use the upload area above to add training materials.' : 'Managers can add materials from this folder.'}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
