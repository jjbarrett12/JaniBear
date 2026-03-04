'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Upload, X, User, Camera } from 'lucide-react';
import Image from 'next/image';

const AVATAR_BUCKET = 'avatars';
const MAX_SIZE_BYTES = 2 * 1024 * 1024;

export function ProfilePhotoSettings() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase.from('profiles').select('avatar_url').eq('id', user.id).maybeSingle().then(({ data }) => {
        if (data?.avatar_url) setAvatarUrl(data.avatar_url);
      });
    });
  }, []);

  const savePhoto = useCallback(async (fileOrBlob: File | Blob, filename = 'photo.jpg') => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const file = fileOrBlob instanceof File ? fileOrBlob : new File([fileOrBlob], filename, { type: 'image/jpeg' });
    if (file.size > MAX_SIZE_BYTES) {
      toast({ title: 'File too large', description: 'Photo must be under 2MB.', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `${user.id}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from(AVATAR_BUCKET)
        .upload(path, file, { upsert: false });

      if (uploadError) {
        if (uploadError.message?.includes('Bucket not found') || uploadError.message?.includes('bucket')) {
          toast({
            title: 'Storage not set up',
            description: 'Run migration 075_avatars_bucket.sql in Supabase SQL Editor (Dashboard → SQL Editor), then try again.',
            variant: 'destructive',
          });
        } else {
          throw uploadError;
        }
        setLoading(false);
        return;
      }

      const { data: { publicUrl } } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setAvatarUrl(publicUrl);
      toast({ title: 'Photo updated', description: 'Your profile photo appears in the header and in crews.' });
    } catch (err: any) {
      console.error(err);
      toast({ title: 'Upload failed', description: err.message || 'Could not update photo.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid file type', description: 'Please upload an image.', variant: 'destructive' });
      return;
    }
    await savePhoto(file, file.name);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const openCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 640 } } });
      streamRef.current = stream;
      setCameraOpen(true);
      setCapturedBlob(null);
      await new Promise((r) => setTimeout(r, 100));
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      toast({
        title: 'Camera unavailable',
        description: err.message || 'Allow camera access to take a photo, or upload a file instead.',
        variant: 'destructive',
      });
    }
  };

  const closeCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraOpen(false);
    setCapturedBlob(null);
  }, []);

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (blob) {
          if (streamRef.current) {
            streamRef.current.getTracks().forEach((t) => t.stop());
            streamRef.current = null;
          }
          if (videoRef.current) videoRef.current.srcObject = null;
          setCapturedBlob(blob);
        }
      },
      'image/jpeg',
      0.9
    );
  };

  const confirmCapturedPhoto = async () => {
    if (!capturedBlob) return;
    await savePhoto(capturedBlob, 'profile-photo.jpg');
    closeCamera();
  };

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, []);

  const handleRemove = async () => {
    if (!avatarUrl) return;

    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const match = avatarUrl.match(/avatars\/(.+)$/);
      const path = match ? match[1] : null;
      if (path) {
        await supabase.storage.from(AVATAR_BUCKET).remove([path]);
      }

      await supabase.from('profiles').update({ avatar_url: null }).eq('id', user.id);
      setAvatarUrl(null);
      toast({ title: 'Photo removed', description: 'Your profile photo has been cleared.' });
    } catch (err: any) {
      toast({ title: 'Remove failed', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Your profile photo
          </CardTitle>
          <CardDescription>
            <strong>Use a clear photo of your face</strong> so teammates can recognize you in the app. This photo appears in the top bar and in crews. You can upload a file or take a new photo with your camera.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row items-start gap-6">
          <div className="flex items-center gap-4">
            {avatarUrl ? (
              <div className="relative">
                <Image
                  src={avatarUrl}
                  alt="Profile"
                  width={80}
                  height={80}
                  className="h-20 w-20 rounded-full object-cover border-2 border-border"
                  unoptimized
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute -top-1 -right-1 h-6 w-6 rounded-full"
                  onClick={handleRemove}
                  disabled={loading}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center border-2 border-dashed border-muted-foreground/30">
                <User className="h-10 w-10 text-muted-foreground" />
              </div>
            )}
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium text-foreground">Clear face photo required</p>
              <div className="flex flex-wrap gap-2">
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  onChange={handleUpload}
                  disabled={loading}
                  className="hidden"
                  id="profile-photo-upload"
                  aria-label="Upload profile photo"
                />
                <Label htmlFor="profile-photo-upload">
                  <Button type="button" variant="outline" size="sm" disabled={loading} onClick={() => fileInputRef.current?.click()}>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload photo
                  </Button>
                </Label>
                <Button type="button" variant="outline" size="sm" disabled={loading} onClick={openCamera}>
                  <Camera className="h-4 w-4 mr-2" />
                  Take photo
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">PNG, JPG or WebP. Max 2MB.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Camera modal */}
      {cameraOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-card rounded-xl border border-border shadow-xl max-w-md w-full overflow-hidden">
            <div className="p-4 border-b border-border">
              <h3 className="font-semibold text-foreground">Take a clear photo of your face</h3>
              <p className="text-sm text-muted-foreground mt-1">Look at the camera and ensure your face is well lit.</p>
            </div>
            <div className="relative bg-black aspect-square flex items-center justify-center">
              {capturedBlob ? (
                <img
                  src={URL.createObjectURL(capturedBlob)}
                  alt="Captured"
                  className="max-h-[60vh] w-auto object-contain"
                />
              ) : (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="max-h-[60vh] w-auto object-contain"
                />
              )}
            </div>
            <div className="p-4 flex gap-2 justify-end border-t border-border">
              {capturedBlob ? (
                <>
                  <Button type="button" variant="outline" onClick={() => { setCapturedBlob(null); openCamera(); }}>
                    Retake
                  </Button>
                  <Button type="button" onClick={confirmCapturedPhoto} disabled={loading}>
                    {loading ? 'Saving…' : 'Use photo'}
                  </Button>
                </>
              ) : (
                <>
                  <Button type="button" variant="outline" onClick={closeCamera}>
                    Cancel
                  </Button>
                  <Button type="button" onClick={capturePhoto}>
                    <Camera className="h-4 w-4 mr-2" />
                    Capture
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
