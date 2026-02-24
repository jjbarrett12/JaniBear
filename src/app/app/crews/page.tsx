import { createClient } from '@/lib/supabase/server';
import { requireOrg } from '@/lib/auth';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Users } from 'lucide-react';

export default async function CrewsPage() {
  const org = await requireOrg();
  const supabase = await createClient();

  const { data: crews } = await supabase
    .from('crews')
    .select('*, crew_members(user_id, profiles(full_name, avatar_url))')
    .eq('org_id', org.org_id)
    .order('name');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Crews</h1>
          <p className="text-muted-foreground mt-1">Manage your cleaning crews</p>
        </div>
        <Link href="/app/crews/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Crew
          </Button>
        </Link>
      </div>

      {crews && crews.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {crews.map((crew: any) => (
            <Link key={crew.id} href={`/app/crews/${crew.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    <CardTitle>{crew.name}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {crew.crew_members?.length || 0} member{crew.crew_members?.length !== 1 ? 's' : ''}
                  </p>
                  {crew.crew_members && crew.crew_members.length > 0 && (
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {crew.crew_members.slice(0, 3).map((member: any) => (
                        <span
                          key={member.user_id}
                          className="inline-flex items-center gap-1.5 text-xs bg-muted px-2 py-1 rounded-full"
                        >
                          {member.profiles?.avatar_url ? (
                            <Image
                              src={member.profiles.avatar_url}
                              alt=""
                              width={20}
                              height={20}
                              className="rounded-full object-cover h-5 w-5"
                              unoptimized
                            />
                          ) : null}
                          {member.profiles?.full_name || 'Unknown'}
                        </span>
                      ))}
                      {crew.crew_members.length > 3 && (
                        <span className="text-xs text-muted-foreground">
                          +{crew.crew_members.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">No crews yet</p>
            <Link href="/app/crews/new">
              <Button>Create Your First Crew</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
