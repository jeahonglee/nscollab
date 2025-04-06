import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { ProfileCard } from '@/components/profile/profile-card';
import { ProfileWithRelations } from '@/lib/supabase/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Filter } from 'lucide-react';

export default async function PeoplePage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; tag?: string }>
}) {
  const supabase = await createClient();
  
  // Check if user is authenticated
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/sign-in');
  }
  
  // Get search and tag parameters
  const search = (await searchParams).search || '';
  const tag = (await searchParams).tag || '';
  
  // Build the query
  let query = supabase
    .from('profiles')
    .select(`
      *,
      ns_stays (*)
    `);
  
  // Apply filters - must do them one by one to handle correctly
  
  // Apply basic search filter on text fields
  if (search) {
    query = query.or(`full_name.ilike.%${search}%,bio.ilike.%${search}%`);
  }
  
  // Apply tag filter if provided
  if (tag) {
    query = query.contains('status_tags', [tag]);
  }
  
  // Execute query
  const { data: profiles, error } = await query;
  
  // If we need to search skills, we need to do post-processing filter since
  // array contains plus or conditions are difficult with Supabase's filters
  let filteredProfiles = profiles;
  
  if (search && profiles) {
    // Get additional matching profiles with skills containing the search term
    const skillMatches = profiles.filter(profile => 
      profile.skills && 
      Array.isArray(profile.skills) && 
      profile.skills.some((skill: string) => 
        skill.toLowerCase().includes(search.toLowerCase())
      )
    );
    
    // Combine with existing profiles (already filtered by name/bio)
    // Use Map to eliminate duplicates by ID
    const profileMap = new Map();
    
    // Add profiles from text field search
    profiles.forEach(profile => {
      profileMap.set(profile.id, profile);
    });
    
    // Add profiles from skills search
    skillMatches.forEach(profile => {
      profileMap.set(profile.id, profile);
    });
    
    // Convert map back to array
    filteredProfiles = Array.from(profileMap.values());
  }
  
  if (error) {
    console.error('Error fetching profiles:', error);
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
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
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
