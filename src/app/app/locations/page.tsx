import { redirect } from 'next/navigation';

/** Redirect legacy Locations route to Accounts. */
export default function LocationsPage() {
  redirect('/app/accounts');
}
