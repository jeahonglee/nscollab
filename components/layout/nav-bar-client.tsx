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

// Simple inline UserMenu component
function InlineUserMenu({ user }: { user: User }) {
  const router = useRouter();
  const [profile, setProfile] = useState<{id: string; full_name: string | null; avatar_url: string | null} | null>(null);
  
  // Get user initials for avatar fallback with consistent server/client rendering
  const getInitials = () => {
    try {
      if (profile?.full_name && typeof profile.full_name === 'string') {
        // Use a deterministic approach for consistent rendering
        const parts = profile.full_name.trim().split(/\s+/);
        const initials = parts
          .filter(part => part.length > 0)
          .map(part => part.charAt(0))
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

  // Lazy load profile data when menu opens
  const handleMenuOpen = async (open: boolean) => {
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
            <AvatarImage src={profile?.avatar_url || ''} alt={profile?.full_name || user.email || ''} />
            <AvatarFallback>{getInitials()}</AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{profile?.full_name || 'NS Member'}</p>
            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem asChild>
          <Link href="/profile/me">Profile</Link>
        </DropdownMenuItem>
        
        <DropdownMenuItem asChild>
          <Link href="/ideas/new">Create Idea</Link>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={signOut}>
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function NavBarClient({ initialUser }: { initialUser: User | null }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user] = useState<User | null>(initialUser);

  // Prefetch important routes for faster navigation
  useEffect(() => {
    // Prefetch key routes
    router.prefetch('/people');
    router.prefetch('/ideas');
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
        <div className="mr-4 flex">
          <Link href="/" className="flex items-center space-x-3">
            <NSLogo width={18} height={20} />
            <span className="font-bold text-lg ns-collab-logo-text">NS Collab</span>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <nav className="flex items-center space-x-4">
            <Link
              href="/people"
              className={`text-sm font-medium transition-colors hover:text-foreground/80 ${
                pathname === '/people' ? 'text-foreground' : 'text-foreground/60'
              }`}
            >
              People
            </Link>
            <Link
              href="/ideas"
              className={`text-sm font-medium transition-colors hover:text-foreground/80 ${
                pathname.startsWith('/ideas') ? 'text-foreground' : 'text-foreground/60'
              }`}
            >
              Ideas
            </Link>
          </nav>
          <div className="flex items-center gap-2">
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
    </header>
  );
}
