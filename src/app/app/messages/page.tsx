import { createClient } from '@/lib/supabase/server';
import { requireOrg } from '@/lib/auth';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { MessageCircle, Plus } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';

export default async function MessagesInboxPage() {
  const org = await requireOrg();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: myParticipation } = await supabase
    .from('conversation_participants')
    .select('conversation_id')
    .eq('user_id', user.id);

  const convIds = (myParticipation ?? []).map((p) => p.conversation_id);
  if (convIds.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">Messages</h1>
          <Link href="/app/messages/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New conversation
            </Button>
          </Link>
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-12 text-center">
          <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400 mb-2">No conversations yet</p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">
            Start a conversation with a crew member or a client contact.
          </p>
          <Link href="/app/messages/new">
            <Button>Start conversation</Button>
          </Link>
        </div>
      </div>
    );
  }

  const [convsResult, participantsResult, messagesResult] = await Promise.all([
    supabase
      .from('conversations')
      .select('id, type, client_id, subject, updated_at')
      .in('id', convIds)
      .order('updated_at', { ascending: false }),
    supabase
      .from('conversation_participants')
      .select('conversation_id, user_id, client_contact_id, profiles(full_name), client_contacts(name, clients(name))')
      .in('conversation_id', convIds),
    supabase
      .from('conversation_messages')
      .select('id, conversation_id, body, created_at')
      .in('conversation_id', convIds)
      .order('created_at', { ascending: false }),
  ]);

  const convs = convsResult.data ?? [];
  const participants = participantsResult.data ?? [];
  const messages = messagesResult.data ?? [];

  const lastMessageByConv: Record<string, { body: string; created_at: string }> = {};
  messages.forEach((m) => {
    if (!lastMessageByConv[m.conversation_id]) {
      lastMessageByConv[m.conversation_id] = { body: m.body, created_at: m.created_at };
    }
  });

  const otherByConv: Record<string, string> = {};
  participants.forEach((p: any) => {
    if (p.user_id === user.id) return;
    const name = p.user_id
      ? (p.profiles?.full_name || 'Crew member')
      : [p.client_contacts?.clients?.name, p.client_contacts?.name].filter(Boolean).join(' – ') || 'Client';
    otherByConv[p.conversation_id] = (otherByConv[p.conversation_id] ? otherByConv[p.conversation_id] + ', ' : '') + name;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Messages</h1>
        <Link href="/app/messages/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New conversation
          </Button>
        </Link>
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
        <ul className="divide-y divide-gray-200 dark:divide-gray-800">
          {convs.map((conv) => (
            <li key={conv.id}>
              <Link
                href={`/app/messages/${conv.id}`}
                className="flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <MessageCircle className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">
                    {otherByConv[conv.id] || (conv.type === 'client' ? 'Client' : 'Crew')}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                    {lastMessageByConv[conv.id]?.body ?? 'No messages yet'}
                  </p>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 shrink-0">
                  {lastMessageByConv[conv.id]?.created_at
                    ? formatRelativeTime(lastMessageByConv[conv.id].created_at)
                    : formatRelativeTime(conv.updated_at)}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
