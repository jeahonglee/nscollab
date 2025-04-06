import Link from 'next/link';
import { IdeaWithRelations } from '@/lib/supabase/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';

interface IdeaCardProps {
  idea: IdeaWithRelations;
}

export function IdeaCard({ idea }: IdeaCardProps) {
  // Format the last activity date
  const lastActivity = formatDistanceToNow(new Date(idea.last_activity_at), {
    addSuffix: true,
  });
  
  // Get initials for avatar fallback
  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'NS';
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <Badge variant="outline" className="mb-2">
            {idea.status}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {lastActivity}
          </span>
        </div>
        <Link
          href={`/ideas/${idea.id}`}
          className="text-lg font-semibold hover:underline"
        >
          {idea.title}
        </Link>
      </CardHeader>
      <CardContent className="flex-1 pb-2">
        <p className="text-sm text-muted-foreground line-clamp-3">
          {idea.description}
        </p>
        
        {idea.looking_for_tags && idea.looking_for_tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {idea.looking_for_tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-2 border-t">
        <div className="w-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage
                src={idea.profile?.avatar_url || ''}
                alt={idea.profile?.full_name || ''}
              />
              <AvatarFallback>
                {getInitials(idea.profile?.full_name)}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs">
              {idea.profile?.full_name || 'Anonymous'}
            </span>
          </div>
          
          {idea.members && idea.members.length > 0 && (
            <div className="flex -space-x-2">
              {idea.members.slice(0, 3).map((member) => (
                <Avatar key={member.id} className="h-6 w-6 border-2 border-background">
                  <AvatarImage
                    src={member.profile?.avatar_url || ''}
                    alt={member.profile?.full_name || ''}
                  />
                  <AvatarFallback>
                    {getInitials(member.profile?.full_name)}
                  </AvatarFallback>
                </Avatar>
              ))}
              
              {idea.members.length > 3 && (
                <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs">
                  +{idea.members.length - 3}
                </div>
              )}
            </div>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
