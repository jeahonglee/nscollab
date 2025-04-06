import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

interface ProfileIdeaCardProps {
  id: string;
  title: string;
  description?: string;
  status: string;
  lookingForTags?: string[];
  role: string;
}

export function ProfileIdeaCard({
  id,
  title,
  description,
  status,
  lookingForTags,
  role,
}: ProfileIdeaCardProps) {
  return (
    <Link href={`/ideas/${id}`} className="block hover:opacity-90 transition-opacity">
      <Card className="h-full flex flex-col hover:shadow-md transition-shadow">
        <CardHeader className="pb-0">
          <div className="flex justify-between items-start gap-2">
            <h3 className="text-lg font-semibold">{title}</h3>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Badge variant="outline" className="text-xs">
                {status}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {role}
              </Badge>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-2">
          {description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
              {description}
            </p>
          )}
          
          {lookingForTags && lookingForTags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              <span className="text-xs text-muted-foreground whitespace-nowrap">Looking for:</span>
              {lookingForTags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
