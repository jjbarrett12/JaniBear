'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Send } from 'lucide-react';

interface ConversationReplyFormProps {
  conversationId: string;
}

export function ConversationReplyForm({ conversationId }: ConversationReplyFormProps) {
  const router = useRouter();
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = body.trim();
    if (!trimmed || loading) return;
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }
    const { error } = await supabase.from('conversation_messages').insert({
      conversation_id: conversationId,
      sender_user_id: user.id,
      sender_client_contact_id: null,
      body: trimmed,
    });
    if (!error) {
      setBody('');
      router.refresh();
    }
    setLoading(false);
  };

  return (
    <form onSubmit={submit} className="flex gap-2 p-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Type a message..."
        rows={2}
        className="min-h-[80px] resize-none"
        disabled={loading}
      />
      <Button type="submit" disabled={loading || !body.trim()} size="icon" className="shrink-0 h-[80px] w-12">
        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
      </Button>
    </form>
  );
}
