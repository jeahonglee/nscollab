import Link from 'next/link';
import { ProfileWithRelations } from '@/lib/supabase/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import {
  FaDiscord,
  FaGithub,
  FaLinkedin,
  FaTwitter,
  FaInstagram,
} from 'react-icons/fa';
import { getInitials } from '@/lib/utils/string-utils';

interface ProfileCardProps {
  profile: ProfileWithRelations;
  currentUserId: string;
}

export function ProfileCard({ profile, currentUserId }: ProfileCardProps) {
  // Extract Discord ID from avatar URL
  const extractDiscordId = (avatarUrl: string | null) => {
    if (!avatarUrl) return '';
    const match = avatarUrl.match(/\/avatars\/([0-9]+)\//);
    return match ? match[1] : '';
  };

  // Check if this is the current user's profile
  const isCurrentUser = profile.id === currentUserId;

  // Format the social media links
  const socialLinks = [
    {
      icon: FaDiscord,
      url:
        profile.discord_username || extractDiscordId(profile.avatar_url)
          ? `https://discord.com/users/${extractDiscordId(profile.avatar_url) || profile.discord_username}`
          : null,
    },
    {
      icon: FaTwitter,
      url: profile.x_handle
        ? `https://x.com/${profile.x_handle.replace('@', '')}`
        : null,
    },
    {
      icon: FaGithub,
      url: profile.github_username
        ? `https://github.com/${profile.github_username}`
        : null,
    },
    { icon: FaLinkedin, url: profile.linkedin_url },
    {
      icon: FaInstagram,
      url: profile.instagram_handle
        ? `https://instagram.com/${profile.instagram_handle}`
        : null,
    },
  ].filter((link) => link.url);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex justify-between">
          <div className="flex items-center gap-3">
            <Link
              href={
                isCurrentUser
                  ? '/profile/me'
                  : `/profile/${profile.discord_username}`
              }
            >
              <Avatar className="h-12 w-12">
                <AvatarImage
                  src={profile.avatar_url || ''}
                  alt={profile.full_name || ''}
                />
                <AvatarFallback>
                  {getInitials(profile.full_name)}
                </AvatarFallback>
              </Avatar>
            </Link>
            <div>
              <Link
                href={
                  isCurrentUser
                    ? '/profile/me'
                    : `/profile/${profile.discord_username}`
                }
              >
                <h3 className="text-lg font-semibold">{profile.full_name}</h3>
              </Link>
              {profile.nspals_profile_url && (
                <a
                  href={profile.nspals_profile_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-muted-foreground hover:underline"
                >
                  NSPals Profile
                </a>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 pb-2">
        {profile.bio && (
          <p className="text-sm line-clamp-3 mb-3">{profile.bio}</p>
        )}

        {profile.skills && profile.skills.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {profile.skills.slice(0, 9).map((skill) => (
              <Badge key={skill} variant="secondary" className="text-xs">
                {skill}
              </Badge>
            ))}
            {profile.skills.length > 9 && (
              <Badge variant="secondary" className="text-xs">
                +{profile.skills.length - 9} more
              </Badge>
            )}
          </div>
        )}

        {/* {profile.status_tags && profile.status_tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {profile.status_tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )} */}
      </CardContent>

      <CardFooter className="py-3 border-t">
        <div className="w-full flex items-center justify-between">
          <div className="flex gap-3 items-center">
            {socialLinks.map((link, index) => {
              const Icon = link.icon;
              return (
                <a
                  key={index}
                  href={link.url || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Icon size={18} />
                </a>
              );
            })}
          </div>

          <Link
            href={
              isCurrentUser
                ? '/profile/me'
                : `/profile/${profile.discord_username}`
            }
            className="text-xs bg-primary/10 text-primary hover:bg-primary/20 px-2.5 py-1 rounded-md transition-colors"
          >
            View Profile
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}
