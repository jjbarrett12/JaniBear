'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Building2, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface NewConversationFormProps {
  orgId: string;
}

type Mode = 'crew' | 'client';

interface CrewMember {
  user_id: string;
  full_name: string | null;
}

interface ClientRow {
  id: string;
  name: string;
}

interface ClientContactRow {
  id: string;
  name: string;
}

export function NewConversationForm({ orgId }: NewConversationFormProps) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('crew');
  const [crewMembers, setCrewMembers] = useState<CrewMember[]>([]);
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [contacts, setContacts] = useState<ClientContactRow[]>([]);
  const [selectedCrewId, setSelectedCrewId] = useState<string>('');
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [selectedContactId, setSelectedContactId] = useState<string>('');
  const [firstMessage, setFirstMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) return;

      const { data: members } = await supabase
        .from('org_members')
        .select('user_id, profiles(full_name)')
        .eq('org_id', orgId);

      const list: CrewMember[] = (members ?? [])
        .filter((m: any) => m.user_id !== user.id)
        .map((m: any) => ({
          user_id: m.user_id,
          full_name: m.profiles?.full_name ?? 'Crew member',
        }));
      if (!cancelled) setCrewMembers(list);

      const { data: clientsData } = await supabase
        .from('clients')
        .select('id, name')
        .eq('org_id', orgId)
        .order('name');
      if (!cancelled) setClients(clientsData ?? []);
      setLoadingData(false);
    })();
    return () => { cancelled = true; };
  }, [orgId, supabase]);

  useEffect(() => {
    if (!selectedClientId) {
      setContacts([]);
      setSelectedContactId('');
      return;
    }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('client_contacts')
        .select('id, name')
        .eq('client_id', selectedClientId);
      if (!cancelled) setContacts(data ?? []);
      setSelectedContactId('');
    })();
    return () => { cancelled = true; };
  }, [selectedClientId, supabase]);

  const startCrewConversation = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !selectedCrewId) return;
    setLoading(true);

    const myParticipation = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', user.id);
    const peerParticipation = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', selectedCrewId);

    const myConvIds = new Set((myParticipation.data ?? []).map((p) => p.conversation_id));
    const existing = (peerParticipation.data ?? []).find((p) => myConvIds.has(p.conversation_id));

    if (existing) {
      const { data: conv } = await supabase
        .from('conversations')
        .select('id')
        .eq('id', existing.conversation_id)
        .eq('type', 'internal')
        .single();
      if (conv) {
        if (firstMessage.trim()) {
          await supabase.from('conversation_messages').insert({
            conversation_id: conv.id,
            sender_user_id: user.id,
            sender_client_contact_id: null,
            body: firstMessage.trim(),
          });
        }
        setLoading(false);
        router.push(`/app/messages/${conv.id}`);
        return;
      }
    }

    const { data: newConv, error: convErr } = await supabase
      .from('conversations')
      .insert({ org_id: orgId, type: 'internal' })
      .select('id')
      .single();

    if (convErr || !newConv) {
      setLoading(false);
      return;
    }

    await supabase.from('conversation_participants').insert([
      { conversation_id: newConv.id, user_id: user.id, client_contact_id: null },
      { conversation_id: newConv.id, user_id: selectedCrewId, client_contact_id: null },
    ]);

    if (firstMessage.trim()) {
      await supabase.from('conversation_messages').insert({
        conversation_id: newConv.id,
        sender_user_id: user.id,
        sender_client_contact_id: null,
        body: firstMessage.trim(),
      });
    }
    setLoading(false);
    router.push(`/app/messages/${newConv.id}`);
  };

  const startClientConversation = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !selectedClientId || !selectedContactId) return;
    setLoading(true);

    const { data: newConv, error: convErr } = await supabase
      .from('conversations')
      .insert({
        org_id: orgId,
        type: 'client',
        client_id: selectedClientId,
      })
      .select('id')
      .single();

    if (convErr || !newConv) {
      setLoading(false);
      return;
    }

    await supabase.from('conversation_participants').insert([
      { conversation_id: newConv.id, user_id: user.id, client_contact_id: null },
      { conversation_id: newConv.id, user_id: null, client_contact_id: selectedContactId },
    ]);

    if (firstMessage.trim()) {
      await supabase.from('conversation_messages').insert({
        conversation_id: newConv.id,
        sender_user_id: user.id,
        sender_client_contact_id: null,
        body: firstMessage.trim(),
      });
    }
    setLoading(false);
    router.push(`/app/messages/${newConv.id}`);
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'crew') startCrewConversation();
    else startClientConversation();
  };

  const canSubmit =
    mode === 'crew'
      ? !!selectedCrewId
      : !!selectedClientId && !!selectedContactId;

  if (loadingData) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/app/messages">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">New conversation</h1>
      </div>

      <div className="flex gap-2 p-1 rounded-lg bg-gray-100 dark:bg-gray-800">
        <button
          type="button"
          onClick={() => setMode('crew')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-colors ${
            mode === 'crew'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <Users className="h-4 w-4" />
          Crew member
        </button>
        <button
          type="button"
          onClick={() => setMode('client')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-colors ${
            mode === 'client'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <Building2 className="h-4 w-4" />
          Client
        </button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {mode === 'crew' ? 'Message a crew member' : 'Message a client'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            {mode === 'crew' ? (
              <div className="space-y-2">
                <Label>Select crew member</Label>
                <Select value={selectedCrewId} onValueChange={setSelectedCrewId} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose someone..." />
                  </SelectTrigger>
                  <SelectContent>
                    {crewMembers.map((m) => (
                      <SelectItem key={m.user_id} value={m.user_id}>
                        {m.full_name}
                      </SelectItem>
                    ))}
                    {crewMembers.length === 0 && (
                      <SelectItem value="_none" disabled>
                        No other crew members
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>Client</Label>
                  <Select value={selectedClientId} onValueChange={setSelectedClientId} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select client..." />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                      {clients.length === 0 && (
                        <SelectItem value="_none" disabled>
                          No clients
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Contact</Label>
                  <Select
                    value={selectedContactId}
                    onValueChange={setSelectedContactId}
                    required
                    disabled={!selectedClientId || contacts.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select contact..." />
                    </SelectTrigger>
                    <SelectContent>
                      {contacts.map((cc) => (
                        <SelectItem key={cc.id} value={cc.id}>
                          {cc.name}
                        </SelectItem>
                      ))}
                      {selectedClientId && contacts.length === 0 && (
                        <SelectItem value="_none" disabled>
                          No contacts for this client
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label>First message (optional)</Label>
              <Textarea
                value={firstMessage}
                onChange={(e) => setFirstMessage(e.target.value)}
                placeholder="Type a message to start the conversation..."
                rows={3}
                className="resize-none"
                disabled={loading}
              />
            </div>

            <Button type="submit" disabled={!canSubmit || loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Start conversation
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
