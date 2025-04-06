import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { createClient } from '@/utils/supabase/server';
import UserMenu from '@/components/layout/user-menu';
import NSLogo from '@/components/ns-logo';
import ThemeSwitcherWrapper from '@/components/layout/theme-switcher-wrapper';

export default async function NavBar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
          <Link href="/" className="flex items-center space-x-3">
            <NSLogo width={18} height={20} />
            <span className="font-bold text-lg">NS Collab</span>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <nav className="flex items-center space-x-4">
            <Link
              href="/people"
              className="text-sm font-medium transition-colors hover:text-foreground/80 text-foreground/60"
            >
              People
            </Link>
            <Link
              href="/ideas"
              className="text-sm font-medium transition-colors hover:text-foreground/80 text-foreground/60"
            >
              Ideas
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeSwitcherWrapper />
            {user ? (
              <UserMenu user={user} />
            ) : (
              <Button asChild size="sm">
                <Link href="/sign-in">Sign In</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
