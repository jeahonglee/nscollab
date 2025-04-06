import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { ProfileCard } from '@/components/profile/profile-card';
import { ProfileWithRelations } from '@/lib/supabase/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search } from 'lucide-react';
import { AutoSubmitSwitch } from '@/components/filter/auto-submit-switch';
import { format } from 'date-fns';

export default async function PeoplePage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; tag?: string; current_ns?: string }>
}) {
  const supabase = await createClient();
  
  // Check if user is authenticated
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/sign-in');
  }
  
  // Get search, tag, and current_ns parameters
  const search = (await searchParams).search || '';
  const tag = (await searchParams).tag || '';
  const currentNsOnly = (await searchParams).current_ns === 'true';
  
  // We need to fetch ALL profiles first and then filter
  // If we have a tag filter, we can apply that at the database level
  let query = supabase
    .from('profiles')
    .select(`
      *,
      ns_stays (*)
    `);
  
  // Only apply tag filter at DB level - we'll handle search filtering in-memory
  if (tag) {
    query = query.contains('status_tags', [tag]);
  }
  
  // Execute query to get all profiles (or filtered by tag if specified)
  const { data: allProfiles, error } = await query;
  
  // Handle any errors
  if (error) {
    console.error('Error fetching profiles:', error);
  }
  
  // Filter profiles based on search criteria and current NS status
  let filteredProfiles = allProfiles;
  
  // If current_ns filter is active, only show people with active NS stays in the current month
  if (currentNsOnly && filteredProfiles && filteredProfiles.length > 0) {
    // Get current year and month in YYYY-MM format for string comparison
    const now = new Date();
    const currentYearMonth = format(now, 'yyyy-MM');
    
    filteredProfiles = filteredProfiles.filter(profile => {
      // Make sure profile has ns_stays and it's an array
      if (!profile.ns_stays || !Array.isArray(profile.ns_stays) || profile.ns_stays.length === 0) {
        return false;
      }
      
      // Check if any of the stays match the current month
      return profile.ns_stays.some((stay: any) => {
        // Each stay has a start_month in YYYY-MM-DD format (e.g., 2025-04-01)
        if (!stay.start_month || typeof stay.start_month !== 'string') {
          return false;
        }
        
        // Simple string comparison using just the YYYY-MM part of the date
        // This avoids any issues with timezone or date parsing
        const stayYearMonth = stay.start_month.substring(0, 7);
        return stayYearMonth === currentYearMonth;
      });
    });
  }
  
  // If search term provided, filter profiles in memory to handle skills properly
  if (search && allProfiles && allProfiles.length > 0) {
    const searchLower = search.toLowerCase();
    
    filteredProfiles = allProfiles.filter(profile => {
      // Search in name
      if (profile.full_name && profile.full_name.toLowerCase().includes(searchLower)) {
        return true;
      }
      
      // Search in bio
      if (profile.bio && profile.bio.toLowerCase().includes(searchLower)) {
        return true;
      }
      
      // Search in skills (if they exist)
      if (profile.skills && Array.isArray(profile.skills)) {
        // Check each skill for the search term
        return profile.skills.some((skill: string) => {
          return skill.toLowerCase().includes(searchLower);
        });
      }
      
      return false;
    });
  }

  // Get unique status tags from all profiles for filtering
  const allTags = new Set<string>();
  filteredProfiles?.forEach(profile => {
    if (profile.status_tags) {
      profile.status_tags.forEach((tag: string) => allTags.add(tag));
    }
  });
  
  const uniqueTags = Array.from(allTags);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">People Directory</h1>
          <p className="text-muted-foreground">
            Discover NS members, their skills, and what they're working on
          </p>
        </div>
      </div>
      
      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <form className="flex-1 flex items-center gap-2" action="/people" method="GET">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              name="search"
              placeholder="Search by name, bio, or skills..."
              className="pl-9"
              defaultValue={search}
            />
          </div>
          <Button type="submit">Search</Button>
        </form>
        
        <AutoSubmitSwitch
          id="current-ns-filter"
          label="Currently in NS"
          paramName="current_ns"
          defaultChecked={currentNsOnly}
        />
      </div>
      
      {/* Status Tag Filters */}
      <div className="flex flex-wrap gap-2">
        {tag && (
          <Badge variant="secondary" className="gap-1">
            {tag}
            <a href="/people" className="ml-1 hover:text-destructive">×</a>
          </Badge>
        )}
        
        {!tag && uniqueTags.map(statusTag => (
          <a key={statusTag} href={`/people?tag=${encodeURIComponent(statusTag)}`}>
            <Badge variant="outline" className="hover:bg-accent cursor-pointer">
              {statusTag}
            </Badge>
          </a>
        ))}
      </div>
      
      {/* Results */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
        {filteredProfiles?.map(profile => (
          <ProfileCard 
            key={profile.id} 
            profile={profile as ProfileWithRelations} 
            currentUserId={user.id}
          />
        ))}
      </div>
      
      {/* Empty State */}
      {(!filteredProfiles || filteredProfiles.length === 0) && (
        <div className="text-center p-12 border rounded-lg">
          <h3 className="text-lg font-medium">No profiles found</h3>
          <p className="text-muted-foreground">
            {search || tag ? 
              'Try adjusting your search or filter criteria' : 
              'No profiles exist in the system yet'}
          </p>
        </div>
      )}
    </div>
  );
}
