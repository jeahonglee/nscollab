import { createClient } from '@/utils/supabase/server';
import NavBarClient from '@/components/layout/nav-bar-client';

export default async function NavBar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Render the client component with server-fetched user data
  return <NavBarClient initialUser={user} />;
}
