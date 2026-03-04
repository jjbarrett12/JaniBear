import { AdminPageLayout } from '@/components/admin/admin-page-layout';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminUsersLoading() {
  return (
    <AdminPageLayout title="Users" description="Manage team members, roles, and access.">
      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md overflow-hidden">
        <div className="p-6 space-y-4">
          <Skeleton className="h-10 w-full max-w-sm" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    </AdminPageLayout>
  );
}
