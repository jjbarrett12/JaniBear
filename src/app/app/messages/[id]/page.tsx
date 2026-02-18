import { createClient } from '@/lib/supabase/server';
import { requireOrg } from '@/lib/auth';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MessageCircle } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import { ConversationReplyForm } from '@/components/messages/conversation-reply-form';

export default async function MessageThreadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: conversationId } = await params;
  const org = await requireOrg();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: conversation } = await supabase
    .from('conversations')
    .select('id, type, client_id, subject, org_id, updated_at')
    .eq('id', conversationId)
    .single();

  if (!conversation) {
    notFound();
  }

  const { data: participants } = await supabase
    .from('conversation_participants')
    .select('user_id, client_contact_id, profiles(full_name), client_contacts(name, clients(name))')
    .eq('conversation_id', conversationId);

  const isParticipant = (participants ?? []).some((p: any) => p.user_id === user.id);
  if (!isParticipant) {
    notFound();
  }

  const { data: messages } = await supabase
    .from('conversation_messages')
    .select('id, sender_user_id, sender_client_contact_id, body, created_at, profiles(full_name)')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  const otherParticipants = (participants ?? []).filter((p: any) => p.user_id !== user.id);
  const otherNames = otherParticipants.map((p: any) =>
    p.user_id
      ? (p.profiles?.full_name || 'Crew member')
      : [p.client_contacts?.clients?.name, p.client_contacts?.name].filter(Boolean).join(' – ') || 'Client'
  );
  const title = otherNames.length ? otherNames.join(', ') : 'Conversation';

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-h-[800px] rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
      <header className="flex items-center gap-3 shrink-0 p-4 border-b border-gray-200 dark:border-gray-800">
        <Link href="/app/messages">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <MessageCircle className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-semibold text-foreground truncate">{title}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {conversation.type === 'client' ? 'Client' : 'Crew'} conversation
          </p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {(messages ?? []).length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">No messages yet. Send one below.</p>
        ) : (
          (messages ?? []).map((m: any) => {
            const isMe = m.sender_user_id === user.id;
            const senderName = m.sender_user_id
              ? (m.profiles?.full_name || 'Crew')
              : 'Client contact';
            return (
              <div
                key={m.id}
                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2 ${
                    isMe
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-gray-100 dark:bg-gray-800 text-foreground'
                  }`}
                >
                  {!isMe && (
                    <p className="text-xs font-medium opacity-90 mb-0.5">{senderName}</p>
                  )}
                  <p className="text-sm whitespace-pre-wrap break-words">{m.body}</p>
                  <p className={`text-xs mt-1 ${isMe ? 'opacity-90' : 'text-gray-500 dark:text-gray-400'}`}>
                    {formatDateTime(m.created_at)}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      <ConversationReplyForm conversationId={conversationId} />
    </div>
  );
}
