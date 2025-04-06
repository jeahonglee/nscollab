import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { formatDistanceToNow } from 'date-fns';

interface Comment {
  id: string;
  user_id: string | null;
  comment_text: string;
  created_at: string;
  profile?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

interface CommentsListProps {
  ideaId: string;
  comments: Comment[];
  currentUserId: string;
}

export function CommentsList({ ideaId, comments, currentUserId }: CommentsListProps) {
  // Sort comments by creation time (newest first)
  const sortedComments = [...comments].sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  
  // Server action to add a new comment
  async function addComment(formData: FormData) {
    'use server';
    
    const commentText = formData.get('comment') as string;
    if (!commentText.trim()) return;
    
    const supabase = await createClient();
    
    // Add comment
    const { error } = await supabase
      .from('idea_comments')
      .insert({
        idea_id: ideaId,
        user_id: currentUserId,
        comment_text: commentText,
      });
    
    if (error) {
      console.error('Error adding comment:', error);
      return;
    }
    
    // Update last activity timestamp
    await supabase
      .from('ideas')
      .update({ last_activity_at: new Date().toISOString() })
      .eq('id', ideaId);
    
    revalidatePath(`/ideas/${ideaId}`);
  }
  
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
    <div className="space-y-6">
      {/* New Comment Form */}
      <form action={addComment} className="flex flex-col gap-2">
        <Textarea
          name="comment"
          placeholder="Add your thoughts or questions..."
          rows={3}
        />
        <div className="flex justify-end">
          <Button type="submit">Add Comment</Button>
        </div>
      </form>
      
      {/* Comments List */}
      <div className="space-y-4">
        {sortedComments.length > 0 ? (
          sortedComments.map((comment) => (
            <div key={comment.id} className="flex gap-4 pb-4 border-b last:border-0">
              <Avatar className="h-8 w-8">
                <AvatarImage
                  src={comment.profile?.avatar_url || ''}
                  alt={comment.profile?.full_name || ''}
                />
                <AvatarFallback>{getInitials(comment.profile?.full_name)}</AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {comment.profile?.full_name || 'Anonymous'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  
                  {comment.user_id === currentUserId && (
                    <Button variant="ghost" size="sm" className="h-6 px-2">
                      Delete
                    </Button>
                  )}
                </div>
                
                <p className="text-sm whitespace-pre-line">{comment.comment_text}</p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-muted-foreground py-4">
            No comments yet. Be the first to contribute to the discussion!
          </p>
        )}
      </div>
    </div>
  );
}
