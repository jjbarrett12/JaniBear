'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Send, Camera } from 'lucide-react';
import Link from 'next/link';
import { formatDateTime } from '@/lib/utils';
import Image from 'next/image';

interface IssueDetailProps {
  issue: any;
  comments: any[];
  photos: any[];
}

export function IssueDetail({ issue: initialIssue, comments: initialComments, photos: initialPhotos }: IssueDetailProps) {
  const router = useRouter();
  const [issue, setIssue] = useState(initialIssue);
  const [comments, setComments] = useState(initialComments);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [users, setUsers] = useState<Array<{ id: string; full_name: string | null }>>([]);

  const statusColors: Record<string, string> = {
    open: 'bg-red-100 text-red-800',
    in_progress: 'bg-yellow-100 text-yellow-800',
    resolved: 'bg-green-100 text-green-800',
  };

  const handleStatusChange = async (newStatus: string) => {
    setIsLoading(true);
    const supabase = createClient();
    
    const { error } = await supabase
      .from('issues')
      .update({
        status: newStatus,
        resolved_at: newStatus === 'resolved' ? new Date().toISOString() : null,
      })
      .eq('id', issue.id);

    if (!error) {
      setIssue({ ...issue, status: newStatus });
    }
    setIsLoading(false);
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    setIsLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
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
      setIsLoading(false);
      return;
    }

    const { data: comment, error } = await supabase
      .from('issue_comments')
      .insert({
        org_id: membership.org_id,
        issue_id: issue.id,
        user_id: user.id,
        body: newComment,
      })
      .select('*, profiles(full_name)')
      .single();

    if (!error && comment) {
      setComments([...comments, comment]);
      setNewComment('');
    }
    setIsLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/app/issues">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">{issue.title}</h1>
          <p className="text-gray-600 mt-1">{issue.locations?.name}</p>
        </div>
        <Select
          value={issue.status}
          onValueChange={handleStatusChange}
          disabled={isLoading}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 whitespace-pre-wrap">{issue.description || 'No description'}</p>
            </CardContent>
          </Card>

          {initialPhotos.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Photos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  {initialPhotos.map((photo, idx) => (
                    <div key={idx} className="relative w-full aspect-square border rounded">
                      <Image
                        src={photo.storage_path}
                        alt={photo.caption || `Photo ${idx + 1}`}
                        fill
                        className="object-cover rounded"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Comments</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="border-b pb-4 last:border-0">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{comment.profiles?.full_name || 'Unknown'}</span>
                    <span className="text-xs text-gray-500">{formatDateTime(comment.created_at)}</span>
                  </div>
                  <p className="text-sm text-gray-700">{comment.body}</p>
                </div>
              ))}
              
              <div className="space-y-2 pt-4">
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  rows={3}
                />
                <Button onClick={handleAddComment} disabled={isLoading || !newComment.trim()}>
                  <Send className="h-4 w-4 mr-2" />
                  Add Comment
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-xs text-gray-500">Status</Label>
                <div className="mt-1">
                  <span className={`px-2 py-1 rounded text-xs ${statusColors[issue.status]}`}>
                    {issue.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Severity</Label>
                <div className="mt-1">
                  <span className="text-sm font-medium capitalize">{issue.severity}</span>
                </div>
              </div>
              {issue.due_at && (
                <div>
                  <Label className="text-xs text-gray-500">Due Date</Label>
                  <div className="mt-1 text-sm">{formatDateTime(issue.due_at)}</div>
                </div>
              )}
              <div>
                <Label className="text-xs text-gray-500">Created</Label>
                <div className="mt-1 text-sm">{formatDateTime(issue.created_at)}</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
