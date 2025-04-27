import { createClient } from '@/utils/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { ProfileWithRelations, CustomLink } from '@/lib/supabase/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { ArrowLeft, ExternalLink, Mail } from 'lucide-react';
import { format } from 'date-fns';
import {
  FaDiscord,
  FaGithub,
  FaLinkedin,
  FaTwitter,
  FaInstagram,
  FaYoutube,
} from 'react-icons/fa';
import NextLogo from '@/components/ns-logo';
import { ProfileIdeaCard } from '@/components/profile/profile-idea-card';

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ discord_username: string }>;
}) {
  const supabase = await createClient();

  // Check if user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect('/sign-in');
  }

  // Await params before using its properties
  const { discord_username } = await params;

  // We'll no longer redirect if viewing your own profile via the username
  // This prevents the redirect loop between /profile/me and /profile/[discord_username]

  // Fetch profile with NS stays by discord username
  const { data: profile, error } = await supabase
    .from('profiles')
    .select(
      `
      *,
      ns_stays (*)
    `
    )
    .eq('discord_username', discord_username)
    .single();

  if (error || !profile) {
    console.error('Error fetching profile:', error);
    notFound();
  }

  const profileWithStays = profile as ProfileWithRelations;

  // Define a type for the idea memberships
  type IdeaMembership = {
    id: string;
    role: string;
    ideas: {
      id: string;
      title: string;
      description: string;
      status: string;
      looking_for_tags: string[];
    };
  };

  // Fetch ideas where this user is a member (either as submitter or team member)
  const { data: ideaMemberships } = (await supabase
    .from('idea_members')
    .select(
      `
      id, role,
      ideas:ideas (id, title, description, status, looking_for_tags)
    `
    )
    .eq('user_id', profile.id)) as { data: IdeaMembership[] | null };

  // console.log('Idea memberships:', ideaMemberships); // For debugging

  // Get initials for avatar fallback
  const getInitials = (name: string | null) => {
    if (!name) return 'NS';
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Format the NS stay dates
  const formatStayDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM yyyy');
  };

  // Extract Discord ID from avatar URL
  const extractDiscordId = (avatarUrl: string | null) => {
    if (!avatarUrl) return '';
    const match = avatarUrl.match(/\/avatars\/([0-9]+)\//);
    return match ? match[1] : '';
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Link
        href="/people"
        className="flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Members Directory
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          {/* Profile Card */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center mb-6">
                <Avatar className="h-24 w-24 mb-4">
                  <AvatarImage
                    src={profileWithStays.avatar_url || ''}
                    alt={profileWithStays.full_name || ''}
                  />
                  <AvatarFallback className="text-xl">
                    {getInitials(profileWithStays.full_name)}
                  </AvatarFallback>
                </Avatar>
                <h1 className="text-2xl font-bold">
                  {profileWithStays.full_name}
                </h1>

                {/* Status Tags */}
                {profileWithStays.status_tags &&
                  profileWithStays.status_tags.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-1 mt-2">
                      {profileWithStays.status_tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
              </div>

              {/* Social Links */}
              <div className="flex justify-center gap-3 mb-6">
                {(profileWithStays.discord_username ||
                  extractDiscordId(profileWithStays.avatar_url)) && (
                  <a
                    href={`https://discord.com/users/${extractDiscordId(profileWithStays.avatar_url) || profileWithStays.discord_username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#5865F2] hover:text-[#4752c4]"
                    aria-label="Discord profile"
                  >
                    <FaDiscord className="h-5 w-5" />
                  </a>
                )}

                {profileWithStays.github_username && (
                  <a
                    href={`https://github.com/${profileWithStays.github_username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-foreground hover:text-muted-foreground"
                    aria-label="GitHub profile"
                  >
                    <FaGithub className="h-5 w-5" />
                  </a>
                )}

                {profileWithStays.linkedin_url && (
                  <a
                    href={profileWithStays.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#0077b5] hover:text-[#005582]"
                    aria-label="LinkedIn profile"
                  >
                    <FaLinkedin className="h-5 w-5" />
                  </a>
                )}

                {profileWithStays.x_handle && (
                  <a
                    href={`https://twitter.com/${profileWithStays.x_handle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-foreground hover:text-muted-foreground"
                    aria-label="Twitter profile"
                  >
                    <FaTwitter className="h-5 w-5" />
                  </a>
                )}

                {profileWithStays.instagram_handle && (
                  <a
                    href={`https://instagram.com/${profileWithStays.instagram_handle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#E1306C] hover:text-[#c13584]"
                    aria-label="Instagram profile"
                  >
                    <FaInstagram className="h-5 w-5" />
                  </a>
                )}

                {profileWithStays.youtube_url && (
                  <a
                    href={profileWithStays.youtube_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#FF0000] hover:text-[#cc0000]"
                    aria-label="YouTube channel"
                  >
                    <FaYoutube className="h-5 w-5" />
                  </a>
                )}

                {/* Email Link */}
                {/* {profileWithStays.email && (
                  <a
                    href={`mailto:${profileWithStays.email}`}
                    className="text-foreground hover:text-muted-foreground"
                    aria-label="Email"
                  >
                    <Mail className="h-5 w-5" />
                  </a>
                )} */}

                {/* NS Pals Link */}
                {profileWithStays.nspals_profile_url && (
                  <a
                    href={profileWithStays.nspals_profile_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-foreground hover:text-muted-foreground"
                    aria-label="NS Pals profile"
                  >
                    <div className="h-5 w-5 flex items-center justify-center">
                      <NextLogo />
                    </div>
                  </a>
                )}
              </div>

              {/* Custom Links */}
              {profileWithStays.custom_links &&
                Array.isArray(profileWithStays.custom_links) &&
                profileWithStays.custom_links.length > 0 && (
                  <div className="border-t pt-4">
                    <h3 className="text-sm font-medium mb-2 text-center">
                      Custom Links
                    </h3>
                    <div className="space-y-2">
                      {(profileWithStays.custom_links as CustomLink[]).map(
                        (link: CustomLink, index: number) => (
                          <a
                            key={index}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm hover:underline text-primary"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            <span>{link.label || link.url}</span>
                          </a>
                        )
                      )}
                    </div>
                  </div>
                )}
            </CardContent>
          </Card>

          {/* NS Stay History */}
          {profileWithStays.ns_stays &&
            profileWithStays.ns_stays.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <NextLogo className="h-4 w-4" />
                    NS Participation
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex flex-wrap gap-2 justify-center">
                    {profileWithStays.ns_stays.map((stay) => {
                      // All stays are considered 'current' since we don't track end_month
                      const isCurrent = true;
                      return (
                        <div
                          key={stay.id}
                          className={`px-3 py-2 rounded-full text-xs flex flex-col items-center ${isCurrent ? 'bg-primary/10 text-primary border border-primary/30' : 'bg-muted'}`}
                        >
                          <span className="font-medium">
                            {formatStayDate(stay.start_month as string)}
                          </span>
                          {/* end_month has been removed from the schema */}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
        </div>

        <div className="md:col-span-2 space-y-6">
          {/* Bio Section */}
          {profileWithStays.bio && (
            <Card>
              <CardContent className="pt-6">
                <h2 className="text-lg font-semibold mb-2">Bio</h2>
                <p className="whitespace-pre-line">
                  {profileWithStays.bio || ''}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Skills Section */}
          {profileWithStays.skills && profileWithStays.skills.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">
                  Skills & Expertise
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-wrap gap-2">
                  {profileWithStays.skills.map((skill) => (
                    <Badge key={skill} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Projects & Ideas */}
          {ideaMemberships && ideaMemberships.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">
                  Projects & Ideas
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="grid gap-4">
                  {ideaMemberships?.map((membership: IdeaMembership) => (
                    <ProfileIdeaCard
                      key={membership.id}
                      id={membership.ideas?.id ?? ''}
                      title={membership.ideas?.title ?? 'Untitled Idea'}
                      description={membership.ideas?.description}
                      status={membership.ideas?.status ?? 'Unknown'}
                      lookingForTags={membership.ideas?.looking_for_tags}
                      role={membership.role}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
