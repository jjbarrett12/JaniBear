import { redirect } from 'next/navigation';
import Link from 'next/link';
import { requireOrg } from '@/lib/auth';
import { requireProGearAccess } from '@/lib/pro-gear-auth';
import { isProGearAdmin } from '@/lib/pro-gear-auth';

export default async function ProGearAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireOrg();
  await requireProGearAccess();
  const isAdmin = await isProGearAdmin();
  if (!isAdmin) redirect('/app/pro-gear');

  return (
    <div className="space-y-4">
      <nav className="flex gap-4 text-sm">
        <Link href="/app/pro-gear/admin" className="hover:underline">
          Products
        </Link>
        <Link href="/app/pro-gear/admin/import" className="hover:underline">
          Import CSV
        </Link>
        <Link href="/app/pro-gear/admin/private-label-inquiries" className="hover:underline">
          Private label inquiries
        </Link>
        <Link href="/app/pro-gear/admin/contact-requests" className="hover:underline">
          Large opportunity requests
        </Link>
      </nav>
      {children}
    </div>
  );
}
