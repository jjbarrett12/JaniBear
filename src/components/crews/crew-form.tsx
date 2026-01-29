'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CrewFormProps {
  initialData?: {
    id: string;
    name: string;
    members?: Array<{ user_id: string; role: string }>;
  };
}

export function CrewForm({ initialData }: CrewFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [crewName, setCrewName] = useState(initialData?.name || '');
  const [availableUsers, setAvailableUsers] = useState<Array<{ id: string; full_name: string | null; email: string }>>([]);
  const [selectedMembers, setSelectedMembers] = useState<Array<{ user_id: string; role: string }>>(
    initialData?.members || []
  );

  useEffect(() => {
    async function loadUsers() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      // Get user's org
      const { data: membership } = await supabase
        .from('org_members')
        .select('org_id')
        .eq('user_id', user.id)
        .limit(1)
        .single();

      if (!membership) return;

      // Get all org members
      const { data: members } = await supabase
        .from('org_members')
        .select('user_id, profiles(id, full_name)')
        .eq('org_id', membership.org_id);

      if (members) {
        const users = members
          .map((m: any) => ({
            id: m.user_id,
            full_name: m.profiles?.full_name || null,
            email: m.user_id, // We'll need to get email from auth.users via a server action
          }))
          .filter((u) => u.id);

        setAvailableUsers(users);
      }
    }

    loadUsers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      setError('You must be logged in');
      setIsLoading(false);
      return;
    }

    // Get user's org
    const { data: membership } = await supabase
      .from('org_members')
      .select('org_id')
      .eq('user_id', user.id)
      .limit(1)
      .single();

    if (!membership) {
      setError('You must belong to an organization');
      setIsLoading(false);
      return;
    }

    try {
      if (initialData) {
        // Update crew
        const { error: updateError } = await supabase
          .from('crews')
          .update({ name: crewName })
          .eq('id', initialData.id);

        if (updateError) throw updateError;

        // Update members (delete all and re-add)
        await supabase
          .from('crew_members')
          .delete()
          .eq('crew_id', initialData.id);

        if (selectedMembers.length > 0) {
          const { error: membersError } = await supabase
            .from('crew_members')
            .insert(
              selectedMembers.map((m) => ({
                org_id: membership.org_id,
                crew_id: initialData.id,
                user_id: m.user_id,
                role: m.role,
              }))
            );

          if (membersError) throw membersError;
        }
      } else {
        // Create crew
        const { data: crew, error: insertError } = await supabase
          .from('crews')
          .insert({ org_id: membership.org_id, name: crewName })
          .select()
          .single();

        if (insertError) throw insertError;

        // Add members
        if (selectedMembers.length > 0 && crew) {
          const { error: membersError } = await supabase
            .from('crew_members')
            .insert(
              selectedMembers.map((m) => ({
                org_id: membership.org_id,
                crew_id: crew.id,
                user_id: m.user_id,
                role: m.role,
              }))
            );

          if (membersError) throw membersError;
        }
      }

      router.push('/app/crews');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Failed to save crew');
    } finally {
      setIsLoading(false);
    }
  };

  const addMember = () => {
    if (availableUsers.length > 0) {
      setSelectedMembers([
        ...selectedMembers,
        { user_id: availableUsers[0].id, role: 'member' },
      ]);
    }
  };

  const removeMember = (index: number) => {
    setSelectedMembers(selectedMembers.filter((_, i) => i !== index));
  };

  const updateMember = (index: number, field: 'user_id' | 'role', value: string) => {
    const updated = [...selectedMembers];
    updated[index] = { ...updated[index], [field]: value };
    setSelectedMembers(updated);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{initialData ? 'Edit Crew' : 'Create Crew'}</CardTitle>
        <CardDescription>
          {initialData ? 'Update crew details and members' : 'Create a new cleaning crew'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Crew Name *</Label>
            <Input
              id="name"
              value={crewName}
              onChange={(e) => setCrewName(e.target.value)}
              required
              disabled={isLoading}
              placeholder="Night Shift Crew A"
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Crew Members</Label>
              <Button type="button" variant="outline" size="sm" onClick={addMember}>
                Add Member
              </Button>
            </div>

            {selectedMembers.length === 0 ? (
              <p className="text-sm text-gray-500">No members added yet</p>
            ) : (
              <div className="space-y-3">
                {selectedMembers.map((member, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <Select
                      value={member.user_id}
                      onValueChange={(value) => updateMember(index, 'user_id', value)}
                      disabled={isLoading}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select member" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableUsers.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.full_name || user.id}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={member.role}
                      onValueChange={(value) => updateMember(index, 'role', value)}
                      disabled={isLoading}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="member">Member</SelectItem>
                        <SelectItem value="leader">Leader</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removeMember(index)}
                      disabled={isLoading}
                    >
                      ×
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              {error}
            </div>
          )}

          <div className="flex gap-2">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : initialData ? 'Update' : 'Create'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isLoading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
