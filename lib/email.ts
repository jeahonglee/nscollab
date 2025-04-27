import { Resend } from 'resend';

// Ensure the API key is available
if (!process.env.RESEND_API_KEY) {
  console.warn(
    'RESEND_API_KEY is not set. Email notifications will be disabled.'
  );
}

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

interface SendCommentNotificationEmailParams {
  to: string;
  ideaTitle: string;
  ideaId: string;
  commenterName: string;
  commentText: string;
}

export async function sendCommentNotificationEmail({
  to,
  ideaTitle,
  ideaId,
  commenterName,
  commentText,
}: SendCommentNotificationEmailParams): Promise<void> {
  if (!resend) {
    console.log('Resend not configured, skipping email notification.');
    return; // Silently fail if Resend is not configured
  }

  // Construct the URL to the idea page
  const ideaUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/ideas/${ideaId}`;

  // Simple text version of the comment for the email
  const truncatedComment =
    commentText.length > 150
      ? commentText.substring(0, 147) + '...'
      : commentText;

  const subject = `New comment on your idea: "${ideaTitle}"`;
  const body = `
    <p>Hi,</p>
    <p><strong>${commenterName}</strong> left a comment on your idea: <strong>"${ideaTitle}"</strong>.</p>
    <blockquote>${truncatedComment}</blockquote>
    <p><a href="${ideaUrl}">Click here to view the comment and reply.</a></p>
    <br>
    <p>Best,</p>
    <p>The NS Collab Team</p>
  `;

  // You MUST verify your sending domain with Resend first.
  const fromEmail = process.env.EMAIL_FROM || 'no-reply@noti.nscollab.com';

  try {
    const { data, error } = await resend.emails.send({
      from: `NS Collab <${fromEmail}>`, // Use a verified domain in production
      to: [to],
      subject: subject,
      html: body,
    });

    if (error) {
      console.error('Error sending email via Resend:', error);
      // Decide if you want to throw an error or just log it
      // throw new Error('Failed to send notification email.');
      return;
    }

    console.log('Notification email sent successfully:', data);
  } catch (error) {
    console.error('Caught exception sending email:', error);
    // Decide if you want to throw an error or just log it
    // throw new Error('Failed to send notification email.');
  }
}
