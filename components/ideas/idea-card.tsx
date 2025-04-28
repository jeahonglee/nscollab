import Link from 'next/link';
import { IdeaWithRelations } from '@/lib/supabase/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';
import { getInitials } from '@/lib/utils/string-utils';
import { SimpleContributionGraph } from '@/components/ui/simple-contribution-graph';

interface IdeaCardProps {
  idea: IdeaWithRelations;
  contributionData?: Array<{ date: string; count: number }>;
}

export function IdeaCard({ idea, contributionData = [] }: IdeaCardProps) {
  // Format the last activity date
  const lastActivity = formatDistanceToNow(new Date(idea.last_activity_at), {
    addSuffix: true,
  });

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <Badge variant="outline" className="mb-2">
            {idea.status}
          </Badge>
          <span className="text-xs text-muted-foreground ns-collab-comments">
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
        
        {/* Contribution graph - positioned at bottom for consistency */}
        {contributionData.length > 0 && (
          <div className="w-full overflow-hidden mt-3">
            <SimpleContributionGraph 
              data={contributionData}
              size="sm" 
              showTooltips={true}
              rightAligned={true}
              className="justify-end w-full"
              dense={true}
            />
          </div>
        )}

        {/* {idea.looking_for_tags && idea.looking_for_tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {idea.looking_for_tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )} */}
      </CardContent>
      <CardFooter className="py-3 border-t">
        <div className="w-full flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Avatar className="h-7 w-7 ring-1 ring-muted/30">
              <AvatarImage
                src={idea.profile?.avatar_url || ''}
                alt={idea.profile?.full_name || 'Unknown'}
              />
              <AvatarFallback className="text-xs">
                {idea.submitter_user_id
                  ? getInitials(idea.profile?.full_name, 'NS')
                  : 'NS'}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs font-medium">
              {idea.submitter_user_id
                ? idea.profile?.full_name || 'Anonymous'
                : 'Unknown'}
            </span>
          </div>

          {idea.members && idea.members.length > 0 && (
            <div className="flex -space-x-2 ml-2">
              {idea.members.slice(0, 3).map((member) => (
                <Avatar
                  key={member.id}
                  className="h-7 w-7 border-2 border-background ring-1 ring-muted/30"
                >
                  <AvatarImage
                    src={member.profile?.avatar_url || ''}
                    alt={member.profile?.full_name || ''}
                  />
                  <AvatarFallback className="text-xs">
                    {getInitials(member.profile?.full_name, 'NS')}
                  </AvatarFallback>
                </Avatar>
              ))}

              {idea.members.length > 3 && (
                <div className="h-7 w-7 rounded-full bg-primary/10 border-2 border-background flex items-center justify-center text-xs font-medium text-primary">
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
