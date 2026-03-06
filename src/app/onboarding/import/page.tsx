import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function ImportIndexPage() {
  redirect('/onboarding/import/upload');
}
