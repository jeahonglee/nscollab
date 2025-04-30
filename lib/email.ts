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
  to: string[];
  ideaTitle: string;
  ideaId: string;
  commenterName: string;
  commentText: string;
}

// Define Resend response type
interface ResendEmailResponse {
  data: {
    id: string;
  } | null;
  error: Error | null;
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
  const ideaUrl = `https://nscollab.com/ideas/${ideaId}`;

  // Simple text version of the comment for the email
  const truncatedComment =
    commentText.length > 150
      ? commentText.substring(0, 147) + '...'
      : commentText;

  const subject = `New comment on idea: "${ideaTitle}"`;
  const body = `
    <p>Hi,</p>
    <p><strong>${commenterName}</strong> left a comment on the idea: <strong>"${ideaTitle}"</strong>.</p>
    <blockquote>${truncatedComment}</blockquote>
    <p><a href="${ideaUrl}">Click here to view the comment and reply.</a></p>
    <br>
    <p>Best,</p>
    <p>The NS Collab Team</p>
  `;

  // You MUST verify your sending domain with Resend first.
  const fromEmail = process.env.EMAIL_FROM || 'no-reply@noti.nscollab.com';

  try {
    // Add a timeout promise to prevent hanging
    const timeoutPromise = new Promise<ResendEmailResponse>((_, reject) =>
      setTimeout(() => reject(new Error('Email sending timeout')), 5000)
    );

    const emailPromise = resend.emails.send({
      from: `NS Collab <${fromEmail}>`, // Use a verified domain in production
      to,
      subject: subject,
      html: body,
    });

    // Race the email sending against the timeout
    const { data, error } = (await Promise.race([
      emailPromise,
      timeoutPromise.then(() => ({
        data: null,
        error: new Error('Email timeout'),
      })),
    ])) as ResendEmailResponse;

    if (error) {
      console.error('Error sending email via Resend:', error);
      // Just log the error without throwing
      return;
    }

    console.log('Notification email sent successfully:', data);
  } catch (error) {
    console.error('Caught exception sending email:', error);
    // Just log the error without throwing
  }
}

export async function notifyIdeaMembersAboutComment({
  ideaId,
  ideaTitle,
  ideaMembers,
  commenterEmail,
  commenterName,
  commentText,
}: {
  ideaId: string;
  ideaTitle: string;
  ideaMembers: string[]; // Array of member emails
  commenterEmail: string;
  commenterName: string;
  commentText: string;
}): Promise<void> {
  // Don't notify the commenter about their own comment
  const recipientsToNotify = ideaMembers.filter(
    (email) => email !== commenterEmail
  );

  if (recipientsToNotify.length === 0) {
    console.log('No members to notify about the comment');
    return;
  }

  console.log(
    `Sending comment notification to ${recipientsToNotify.length} recipients`
  );

  await sendCommentNotificationEmail({
    to: recipientsToNotify,
    ideaTitle,
    ideaId,
    commenterName,
    commentText,
  });
}
