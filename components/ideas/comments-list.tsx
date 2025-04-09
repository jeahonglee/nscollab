'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { LoadingOverlay } from '@/components/ui/loading-overlay';
import { getInitials } from '@/lib/utils/string-utils';
// Import server actions from comment-actions.ts
import { addComment, deleteComment } from '@/lib/comment-actions';

interface Comment {
  id: string;
  user_id: string | null;
  comment_text: string;
  created_at: string;
  profile?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    discord_username?: string | null;
  } | null;
}

interface CommentsListProps {
  ideaId: string;
  comments: Comment[];
  currentUserId: string;
}

export function CommentsList({
  ideaId,
  comments,
  currentUserId,
}: CommentsListProps) {
  const router = useRouter();
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [isDeletingComment, setIsDeletingComment] = useState<string | null>(
    null
  );

  // Sort comments by creation time (newest first)
  const sortedComments = [...comments].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );



  return (
    <div className="space-y-6">
      {/* New Comment Form */}
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const form = e.target as HTMLFormElement;
          setIsAddingComment(true);
          try {
            const formData = new FormData(form);
            await addComment(formData, ideaId, currentUserId);
            // Reset the form instead of using querySelector
            form.reset();
            router.refresh();
          } catch (error) {
            console.error('Error adding comment:', error);
          } finally {
            setIsAddingComment(false);
          }
        }}
        className="flex flex-col gap-2"
      >
        <Textarea
          name="comment"
          placeholder="Add your thoughts or questions..."
          rows={3}
        />
        <div className="flex justify-end">
          <Button type="submit" disabled={isAddingComment}>
            {isAddingComment ? 'Adding...' : 'Add Comment'}
          </Button>
        </div>
        <LoadingOverlay
          isLoading={isAddingComment}
          loadingText="Adding comment..."
        />
      </form>

      {/* Comments List */}
      <div className="space-y-4">
        {sortedComments.length > 0 ? (
          sortedComments.map((comment) => (
            <div
              key={comment.id}
              className="flex gap-4 pb-4 border-b last:border-0"
            >
              {comment.profile?.discord_username ? (
                <Link href={`/profile/${comment.profile.discord_username}`}>
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={comment.profile?.avatar_url || ''}
                      alt={comment.profile?.full_name || ''}
                    />
                    <AvatarFallback>
                      {getInitials(comment.profile?.full_name, 'NS')}
                    </AvatarFallback>
                  </Avatar>
                </Link>
              ) : (
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={comment.profile?.avatar_url || ''}
                    alt={comment.profile?.full_name || ''}
                  />
                  <AvatarFallback>
                    {getInitials(comment.profile?.full_name, 'NS')}
                  </AvatarFallback>
                </Avatar>
              )}

              <div className="flex-1">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {comment.profile?.discord_username ? (
                        <Link
                          href={`/profile/${comment.profile.discord_username}`}
                          className="hover:underline"
                        >
                          {comment.profile.full_name || 'Anonymous'}
                        </Link>
                      ) : (
                        comment.profile?.full_name || 'Anonymous'
                      )}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(comment.created_at), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>

                  {comment.user_id === currentUserId && (
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        const form = e.target as HTMLFormElement;
                        // Get the commentId from the parent component directly
                        const commentId = comment.id;
                        setIsDeletingComment(commentId);
                        try {
                          const formData = new FormData(form);
                          await deleteComment(formData, ideaId, currentUserId);
                          router.refresh();
                        } catch (error) {
                          console.error('Error deleting comment:', error);
                        } finally {
                          setIsDeletingComment(null);
                        }
                      }}
                    >
                      <input
                        type="hidden"
                        name="commentId"
                        value={comment.id}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2"
                        type="submit"
                        disabled={isDeletingComment === comment.id}
                      >
                        {isDeletingComment === comment.id
                          ? 'Deleting...'
                          : 'Delete'}
                      </Button>
                    </form>
                  )}
                </div>

                <p className="text-sm whitespace-pre-line">
                  {comment.comment_text}
                </p>
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
