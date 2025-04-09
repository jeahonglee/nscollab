'use client';

import { useState } from 'react';
import { addFeedback, deleteFeedback } from '@/lib/actions/feedback-actions';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';
import { Textarea } from '@/components/ui/textarea';
import { Trash2, MessageSquareText } from 'lucide-react';
import { LoadingOverlay } from '@/components/ui/loading-overlay';
import { Separator } from '@/components/ui/separator';
import { getInitials } from '@/lib/utils/string-utils';

type FeedbackProps = {
  feedbacks: {
    id: string;
    message: string;
    created_at: string;
    user_id: string;
    profile: {
      id: string;
      full_name: string | null;
      avatar_url: string | null;
    } | null;
  }[];
  currentUserId: string;
};

export default function FeedbackBoard({
  feedbacks,
  currentUserId,
}: FeedbackProps) {
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await addFeedback(message);
      if (result.error) {
        setError(result.error);
      } else {
        setMessage('');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Error submitting feedback:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    setIsDeleting(id);
    setError(null);

    try {
      const result = await deleteFeedback(id);
      if (result.error) {
        setError(result.error);
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Error deleting feedback:', err);
    } finally {
      setIsDeleting(null);
    }
  };



  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center text-base">
          <MessageSquareText className="h-5 w-5 mr-2" />
          Feedback Board
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Form to submit new feedback */}
        <form onSubmit={handleSubmit} className="relative pb-4">
          <LoadingOverlay isLoading={isSubmitting} loadingText="Submitting feedback..." />
          <Textarea
            placeholder="Leave your feedback or message here..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full mb-2 resize-none bg-muted/30"
            rows={2}
            disabled={isSubmitting}
            required
          />
          <div className="flex justify-end">
            <Button
              type="submit"
              size="sm"
              variant="outline"
              className="text-xs"
              disabled={isSubmitting || !message.trim()}
            >
              Post Feedback
            </Button>
          </div>
          {error && <p className="text-destructive text-sm mt-2">{error}</p>}
        </form>

        {feedbacks.length > 0 && <Separator className="my-2" />}

        {/* Feedback messages */}
        <div className="space-y-4 mt-3">
          {feedbacks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-2">
              No feedback yet. Be the first to leave a message!
            </p>
          ) : (
            feedbacks.map((feedback) => (
              <div
                key={feedback.id}
                className="relative p-2 group hover:bg-accent/30 rounded-md transition-colors"
              >
                <LoadingOverlay isLoading={isDeleting === feedback.id} loadingText="Deleting feedback..." />
                <div className="flex items-start gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage
                      src={feedback.profile?.avatar_url || undefined}
                      alt="Profile"
                    />
                    <AvatarFallback className="text-[10px]">
                      {getInitials(feedback.profile?.full_name, '?')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-semibold text-xs">
                          {feedback.profile?.full_name || 'Anonymous'}
                        </span>
                        <span className="text-xs text-muted-foreground ml-2">
                          {formatDistanceToNow(new Date(feedback.created_at), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                      {currentUserId === feedback.user_id && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleDelete(feedback.id)}
                          disabled={isDeleting === feedback.id}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                    <p className="text-xs mt-1 whitespace-pre-line">
                      {feedback.message}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
