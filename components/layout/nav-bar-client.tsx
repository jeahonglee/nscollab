'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import NSLogo from '@/components/ns-logo';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Menu } from 'lucide-react';

// Simple inline UserMenu component
function InlineUserMenu({ user }: { user: User }) {
  const router = useRouter();
  const [profile, setProfile] = useState<{
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null>(null);

  // Load profile data when component mounts
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .eq('id', user.id)
          .single();

        if (data) {
          setProfile(data);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };

    fetchProfile();
  }, [user.id]);

  // Get user initials for avatar fallback with consistent server/client rendering
  const getInitials = () => {
    try {
      if (profile?.full_name && typeof profile.full_name === 'string') {
        // Use a deterministic approach for consistent rendering
        const parts = profile.full_name.trim().split(/\s+/);
        const initials = parts
          .filter((part) => part.length > 0)
          .map((part) => part.charAt(0))
          .join('')
          .toUpperCase()
          .substring(0, 2);

        return initials || 'NS';
      }

      // Fallback to email if no full name
      if (user.email && typeof user.email === 'string') {
        return user.email.trim().substring(0, 2).toUpperCase() || 'NS';
      }

      return 'NS';
    } catch {
      // Failsafe
      return 'NS';
    }
  };

  // Update profile data when menu opens if needed
  const handleMenuOpen = async (open: boolean) => {
    // We still check if profile exists in case it failed to load on mount
    if (open && !profile) {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .eq('id', user.id)
          .single();

        if (data) {
          setProfile(data);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    }
  };

  const signOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
  };

  return (
    <DropdownMenu onOpenChange={handleMenuOpen}>
      <DropdownMenuTrigger asChild>
        <button className="avatar-button rounded-full focus:outline-none focus:ring-2 focus:ring-ring">
          <Avatar className="h-8 w-8">
            <AvatarImage
              src={profile?.avatar_url || ''}
              alt={profile?.full_name || user.email || ''}
            />
            <AvatarFallback>{getInitials()}</AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {profile?.full_name || 'NS Member'}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link href="/profile/me">Edit My Profile</Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href="/ideas/new">Add New Project/Idea</Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={signOut}>Log out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Mobile menu component that shows on small screens
function MobileMenu({
  user,
  pathname,
}: {
  user: User | null;
  pathname: string;
}) {
  const router = useRouter();
  const [profile, setProfile] = useState<{
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null>(null);

  // Load profile data when menu opens if user is logged in
  const handleMenuOpen = async (open: boolean) => {
    if (open && user && !profile) {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .eq('id', user.id)
          .single();

        if (data) {
          setProfile(data);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    }
  };

  const signOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
  };

  return (
    <DropdownMenu onOpenChange={handleMenuOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {user ? profile?.full_name || 'NS Member' : 'Navigation'}
            </p>
            {user && (
              <p className="text-xs leading-none text-muted-foreground">
                {user.email}
              </p>
            )}
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link
            href="/timeline"
            className={pathname === '/timeline' ? 'bg-secondary/50' : ''}
          >
            Timeline
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link
            href="/people"
            className={pathname === '/people' ? 'bg-secondary/50' : ''}
          >
            People
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link
            href="/ideas"
            className={pathname === '/ideas' ? 'bg-secondary/50' : ''}
          >
            Ideas
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link
            href="/demoday"
            className={pathname === '/demoday' ? 'bg-secondary/50' : ''}
          >
            Demoday
          </Link>
        </DropdownMenuItem>

        {user ? (
          <>
            <DropdownMenuSeparator />

            <DropdownMenuItem asChild>
              <Link href="/profile/me">Edit My Profile</Link>
            </DropdownMenuItem>

            <DropdownMenuItem asChild>
              <Link href="/ideas/new">Add New Project/Idea</Link>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem onClick={signOut}>Log out</DropdownMenuItem>
          </>
        ) : (
          <>
            <DropdownMenuSeparator />

            <DropdownMenuItem asChild>
              <Link href="/sign-in">Sign In</Link>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function NavBarClient({
  initialUser,
}: {
  initialUser: User | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user] = useState<User | null>(initialUser);

  // Prefetch important routes for faster navigation
  useEffect(() => {
    // Prefetch key routes
    router.prefetch('/timeline');
    router.prefetch('/people');
    router.prefetch('/ideas');
    router.prefetch('/demoday');
    if (user) {
      router.prefetch('/profile/me');
      router.prefetch('/ideas/new');
    } else {
      router.prefetch('/sign-in');
    }
  }, [router, user]);

  return (
    <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="flex items-center">
          <Link href="/" className="flex items-center space-x-3">
            <NSLogo width={18} height={20} />
            <span className="font-bold text-lg ns-collab-logo-text">
              NS Collab
            </span>
          </Link>

          {/* Navigation menu positioned next to logo, hidden on mobile */}
          <nav className="hidden md:flex items-center ml-6 space-x-3">
            <Link
              href="/timeline"
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all border ${
                pathname === '/timeline'
                  ? 'bg-primary text-primary-foreground border-primary-foreground shadow-sm'
                  : 'bg-secondary/80 text-secondary-foreground border-secondary hover:bg-secondary'
              }`}
            >
              Timeline
            </Link>
            <Link
              href="/people"
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all border ${
                pathname === '/people'
                  ? 'bg-primary text-primary-foreground border-primary-foreground shadow-sm'
                  : 'bg-secondary/80 text-secondary-foreground border-secondary hover:bg-secondary'
              }`}
            >
              People
            </Link>
            <Link
              href="/ideas"
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all border ${
                pathname === '/ideas'
                  ? 'bg-primary text-primary-foreground border-primary-foreground shadow-sm'
                  : 'bg-secondary/80 text-secondary-foreground border-secondary hover:bg-secondary'
              }`}
            >
              Ideas
            </Link>
            <Link
              href="/demoday"
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all border ${
                pathname === '/demoday'
                  ? 'bg-primary text-primary-foreground border-primary-foreground shadow-sm'
                  : 'bg-secondary/80 text-secondary-foreground border-secondary hover:bg-secondary'
              }`}
            >
              Demoday
            </Link>
          </nav>
        </div>

        <div className="flex flex-1 items-center justify-end">
          <div className="flex items-center gap-2">
            {/* Mobile menu component */}
            <MobileMenu user={user} pathname={pathname} />

            {/* Desktop auth/profile component */}
            <div className="hidden md:block">
              {user ? (
                <InlineUserMenu user={user} />
              ) : (
                <Button asChild size="sm">
                  <Link href="/sign-in">Sign In</Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
