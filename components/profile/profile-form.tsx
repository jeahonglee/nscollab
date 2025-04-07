"use client";

import { User } from '@supabase/supabase-js';
import { ProfileWithRelations, STATUS_TAGS, CustomLink } from '@/lib/supabase/types';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

// Import server actions from a separate file
// Using direct import as aliases might be configured differently
import { updateProfile, addNsStay, deleteNsStay } from '@/lib/profile-actions';
import { LoadingOverlay } from '@/components/ui/loading-overlay';

interface ProfileFormProps {
  user: User;
  profile: ProfileWithRelations;
}

export default function ProfileForm({ user, profile }: ProfileFormProps) {
  // State for the year selection in NS stays month toggle
  const [selectedYear, setSelectedYear] = useState(() => {
    const currentYear = new Date().getFullYear();
    return currentYear;
  });
  
  // State to track if form is submitting or adding/deleting NS stays
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAddingNsStay, setIsAddingNsStay] = useState(false);
  const [isDeletingNsStay, setIsDeletingNsStay] = useState(false);
  const router = useRouter();
  
  // Initialize custom links from profile or empty array
  const [customLinks, setCustomLinks] = useState<CustomLink[]>(
    profile.custom_links && Array.isArray(profile.custom_links)
      ? (profile.custom_links as CustomLink[])
      : []
  );
  
  // Client-side wrapper for updateProfile server action
  const handleUpdateProfile = async (formData: FormData) => {
    try {
      setIsSubmitting(true);
      // Use imported server action
      await updateProfile(formData, user.id);
      router.refresh();
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Client-side wrapper for addNsStay server action
  const handleAddNsStay = async (formData: FormData) => {
    try {
      setIsAddingNsStay(true);
      await addNsStay(formData, user.id);
      router.refresh();
    } catch (error) {
      console.error('Error adding NS stay:', error);
    } finally {
      setIsAddingNsStay(false);
    }
  };

  // Client-side wrapper for deleteNsStay server action
  const handleDeleteNsStay = async (formData: FormData) => {
    try {
      setIsDeletingNsStay(true);
      await deleteNsStay(formData, user.id);
      router.refresh();
    } catch (error) {
      console.error('Error deleting NS stay:', error);
    } finally {
      setIsDeletingNsStay(false);
    }
  };
  
  // Helper to format date for display
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
  };
  
  // Get initials for avatar
  const getInitials = () => {
    if (profile.full_name) {
      return profile.full_name
        .split(' ')
        .map((name: string) => name[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
    }
    return user.email?.substring(0, 2).toUpperCase() || 'NS';
  };

  // Helper to check if a specific month is part of an NS stay
  const isMonthActive = (year: number, month: number) => {
    if (!profile.ns_stays || profile.ns_stays.length === 0) return false;
    
    // Format the date to match our database format (YYYY-MM-DD)
    const monthStr = String(month + 1).padStart(2, '0');
    const formattedDate = `${year}-${monthStr}-01`;
    
    // Check if any stay has this specific month
    return profile.ns_stays.some(stay => {
      // For stays with a start_month
      if (stay.start_month) {
        // Only compare the year and month parts
        const startMonthStr = stay.start_month.substring(0, 7); // YYYY-MM
        const thisMonthStr = formattedDate.substring(0, 7); // YYYY-MM
        
        // We only have start_month in our schema now
        // Just check exact match with start_month
        return startMonthStr === thisMonthStr;
      }
      
      // If we get here, this month is not active
      return false;
    });
  };

  // Helper to toggle a month's status
  const handleToggleMonth = async (year: number, month: number) => {
    // Format the date to match our database format (YYYY-MM-DD)
    // Remembering from our memory to append -01 for proper date formatting
    const monthStr = String(month + 1).padStart(2, '0');
    const formattedMonth = `${year}-${monthStr}-01`;
    
    // Check if this month is already active
    const monthActive = isMonthActive(year, month);
    
    if (monthActive) {
      // If month is already active, we need to remove it
      
      // Find the stay that contains this month
      const stayWithThisMonth = profile.ns_stays?.find(stay => {
        if (stay.start_month) {
          return stay.start_month.substring(0, 7) === `${year}-${monthStr}`;
        }
        return false;
      });
      
      if (stayWithThisMonth) {
        // Prepare form data for deletion
        const formData = new FormData();
        formData.append('stay_id', stayWithThisMonth.id);
        formData.append('profile_id', profile.id);
        
        // Delete the stay
        await deleteNsStay(formData, user.id);
      }
    } else {
      // Month is not active, add it
      const formData = new FormData();
      formData.append('start_month', formattedMonth);
      formData.append('profile_id', profile.id);
      
      // Add the new stay
      await addNsStay(formData, user.id);
    }
  };
  
  // Helper to navigate to next/prev year
  const changeYear = (increment: number) => {
    setSelectedYear((prev: number) => prev + increment);
  };

  return (
    <>
      <LoadingOverlay isLoading={isSubmitting} loadingText="Saving profile information..." />
      <LoadingOverlay isLoading={isAddingNsStay} loadingText="Adding NS stay..." />
      <LoadingOverlay isLoading={isDeletingNsStay} loadingText="Removing NS stay..." />
      <form 
        onSubmit={async (e) => {
          e.preventDefault();
          setIsSubmitting(true);
          try {
            const formData = new FormData(e.currentTarget);
            await updateProfile(formData, user.id);
            // Keep loading state active during navigation
            router.refresh();
            return; // Skip the finally block
          } catch (error) {
            console.error('Error updating profile:', error);
            // Only reset loading state if there was an error
            setIsSubmitting(false);
          }
        }} 
        className="space-y-6 w-full"
      >
      {/* Top save button */}
      <Button 
        type="submit" 
        className="w-full mb-4" 
        disabled={isSubmitting}
      >
        {isSubmitting ? "Saving..." : "Save Profile"}
      </Button>
      
      <div className="space-y-12">
      {/* Basic Info Section */}
      <div className="border-b pb-8">
        <h2 className="text-2xl font-semibold mb-6">Basic Info</h2>
        <div className="flex flex-col gap-2">
            <div className="flex items-center gap-4 mb-4">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profile.avatar_url || ''} alt={profile.full_name || ''} />
                <AvatarFallback className="text-xl">{getInitials()}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-medium">Profile Picture</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Your profile picture will be automatically synced from your auth provider.
                </p>
              </div>
            </div>
            
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input 
                  id="fullName" 
                  name="fullName" 
                  defaultValue={profile.full_name || ''} 
                  placeholder="Your name"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea 
                  id="bio" 
                  name="bio" 
                  defaultValue={profile.bio || ''}
                  placeholder="Tell us about yourself and your professional background"
                  rows={6}
                />
                <p className="text-sm text-muted-foreground">Tell us about yourself and your expertise</p>
              </div>
            </div>
            
          </div>
      </div>
      
      {/* Social Links Section */}
      <div className="border-b pb-8">
        <h2 className="text-2xl font-semibold mb-6">Social & Links</h2>
        <div className="space-y-6">
          {/* Discord section with special notes */}
          <div className="grid gap-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="discordUsername" className="min-w-28">Discord</Label>
              <Input 
                id="discordUsername" 
                name="discordUsername" 
                defaultValue={profile.discord_username || ''} 
                placeholder="username"
                disabled
                className="opacity-70 flex-1"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Discord username is automatically set during Discord sign-in and cannot be changed here.
            </p>
            {profile.discord_username && (
              <div className="text-sm text-muted-foreground">
                NSPals profile: <a 
                  href={`https://nspals.com/${profile.discord_username}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  nspals.com/{profile.discord_username}
                </a>
              </div>
            )}
          </div>
          
          {/* Social links in 2 columns on desktop, 1 on mobile */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="githubUsername" className="min-w-28">GitHub</Label>
              <Input 
                id="githubUsername" 
                name="githubUsername" 
                defaultValue={profile.github_username || ''} 
                placeholder="username"
                className="flex-1"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Label htmlFor="xHandle" className="min-w-28">X (Twitter)</Label>
              <Input 
                id="xHandle" 
                name="xHandle" 
                defaultValue={profile.x_handle || ''} 
                placeholder="@username"
                className="flex-1"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Label htmlFor="linkedinUrl" className="min-w-28">LinkedIn</Label>
              <Input 
                id="linkedinUrl" 
                name="linkedinUrl" 
                defaultValue={profile.linkedin_url || ''} 
                placeholder="username"
                className="flex-1"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Label htmlFor="instagramHandle" className="min-w-28">Instagram</Label>
              <Input 
                id="instagramHandle" 
                name="instagramHandle" 
                defaultValue={profile.instagram_handle || ''} 
                placeholder="username"
                className="flex-1"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Label htmlFor="threadsHandle" className="min-w-28">Threads</Label>
              <Input 
                id="threadsHandle" 
                name="threadsHandle" 
                defaultValue={profile.threads_handle || ''} 
                placeholder="username"
                className="flex-1"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Label htmlFor="youtubeUrl" className="min-w-28">YouTube</Label>
              <Input 
                id="youtubeUrl" 
                name="youtubeUrl" 
                defaultValue={profile.youtube_url || ''} 
                placeholder="URL"
                className="flex-1"
              />
            </div>
          </div>
            
            <div className="mt-4 border-t pt-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-medium">Custom Links</h3>
              </div>
              
              {/* Custom Links Section */}
              <div className="space-y-3">
                {/* Custom links section */}
                {(() => {
                  // Define functions to manipulate the custom links
                  const addLink = () => {
                    setCustomLinks([...customLinks, { label: '', url: '' }]);
                  };
                  
                  const removeLink = (index: number) => {
                    setCustomLinks(customLinks.filter((_, i) => i !== index));
                  };
                  
                  return (
                    <>
                      {/* Hidden input to track the number of custom links */}
                      <input 
                        type="hidden" 
                        name="customLinksCount" 
                        value={customLinks.length} 
                      />
                      
                      {customLinks.map((link, index) => (
                        <div key={index} className="flex gap-2 items-center">
                          <Input 
                            name={`customLinkLabel${index}`} 
                            defaultValue={link.label} 
                            placeholder="Label (e.g. Portfolio)"
                            className="w-1/3"
                          />
                          <Input 
                            name={`customLinkUrl${index}`} 
                            defaultValue={link.url} 
                            placeholder="URL"
                            className="flex-1"
                          />
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => removeLink(index)}
                            className="text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={addLink}
                      >
                        <Plus className="h-4 w-4 mr-2" /> Add Link
                      </Button>
                    </>
                  );
                })()}
              </div>
            </div>
            
          </div>
        </div>
      </div>
      
      {/* Skills & Status Section */}
      <div className="border-b pb-8">
        <h2 className="text-2xl font-semibold mb-6">Skills & Status</h2>
        <div className="grid gap-6">
            <div className="grid gap-2">
              <Label htmlFor="skills">Skills & Expertise</Label>
              <p className="text-sm text-muted-foreground mb-2">
                Enter your skills separated by commas (e.g., &quot;React, Python, Marketing, UI/UX&quot;)
              </p>
              <Textarea 
                id="skills" 
                name="skills" 
                defaultValue={profile.skills ? profile.skills.join(', ') : ''}
                placeholder="React, Python, Marketing, UI/UX Design, etc."
                rows={3}
              />
            </div>
            
            <div className="grid gap-2">
              <Label>Status Tags</Label>
              <p className="text-sm text-muted-foreground mb-2">
                Select status tags that best describe your current situation
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                {STATUS_TAGS.map((tag) => {
                  const id = `status-${tag.replace(/\s/g, '-').toLowerCase()}`;
                  // Make the check more robust by ensuring status_tags is an array
                  // and do a case-insensitive comparison
                  const statusTags = Array.isArray(profile.status_tags) ? profile.status_tags : [];
                  const isChecked = statusTags.some(
                    (statusTag) => statusTag && statusTag.toLowerCase() === tag.toLowerCase()
                  );
                  
                  return (
                    <div key={id} className="flex items-center space-x-2">
                      <Checkbox 
                        id={id} 
                        name={`status-${tag.replace(/\s/g, '-').toLowerCase()}`}
                        defaultChecked={isChecked} 
                      />
                      <Label htmlFor={id} className="font-normal">{tag}</Label>
                    </div>
                  );
                })}
              </div>
            </div>
            
          </div>
      </div>
      
      {/* NS Participation Section */}
      <div>
        <h2 className="text-2xl font-semibold mb-6">NS Participation</h2>
        
        {/* Month Toggle UI */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Select Your NS Months</CardTitle>
            <CardDescription>
              Toggle the months you&apos;ve participated in Network School
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Year selector */}
            <div className="flex items-center justify-between mb-4">
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => changeYear(-1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-lg font-medium">{selectedYear}</span>
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => changeYear(1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Month grid */}
            <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
              {Array.from({ length: 12 }, (_, i) => {
                const monthName = new Date(2000, i, 1).toLocaleString('default', { month: 'short' });
                const isActive = isMonthActive(selectedYear, i);
                
                return (
                  <Button 
                    key={i}
                    variant={isActive ? "default" : "outline"}
                    className={`h-12 ${isActive ? 'bg-primary' : ''}`}
                    onClick={() => handleToggleMonth(selectedYear, i)}
                    type="button"
                  >
                    {monthName}
                  </Button>
                );
              })}
            </div>
            
            <p className="text-sm text-muted-foreground mt-4">
              Click a month to toggle your participation. Selected months are highlighted.
            </p>
          </CardContent>
        </Card>
        
        {/* Hidden form elements for deletion functionality */}
        <div className="hidden">
          {profile.ns_stays && profile.ns_stays.map((stay) => (
            <input key={stay.id} type="hidden" name={`ns_stay_${stay.id}`} value={stay.id} />
          ))}
        </div>
      </div>
      
      {/* Bottom save button */}
      <Button 
        type="submit" 
        className="w-full mt-6" 
        disabled={isSubmitting}
      >
        {isSubmitting ? "Saving..." : "Save Profile"}
      </Button>
    </form>
    </>
  );
}
