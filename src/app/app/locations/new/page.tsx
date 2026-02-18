import { redirect } from 'next/navigation';

/** Redirect legacy New Location route to New Account. */
export default function NewLocationPage() {
  redirect('/app/accounts/new');
}
