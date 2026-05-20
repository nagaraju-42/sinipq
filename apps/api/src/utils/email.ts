import { Resend } from 'resend';

// Initialize Resend with the API key from your .env file
const resend = new Resend(process.env.RESEND_API_KEY);

export const sendQueueConfirmationEmail = async (
  email: string,
  customerName: string,
  barberName: string,
  position: number
) => {
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'onboarding@resend.dev', 
      to: email,
      subject: 'You are in line! - SnipQ',
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #10B981;">You're on the list, ${customerName}! ✂️</h2>
          <p>You have successfully joined the queue for <strong>${barberName}</strong>.</p>
          
          <div style="background-color: #F3F4F6; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <p style="margin: 0; font-size: 16px; color: #6B7280;">Your Current Position</p>
            <h1 style="margin: 10px 0 0 0; font-size: 48px; color: #0F172A;">#${position}</h1>
          </div>
          
          <p>Head to the shop or keep an eye on the app. We will notify you when it's almost your turn.</p>
          <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 30px 0;" />
          <p style="font-size: 12px; color: #9CA3AF;">Powered by SnipQ</p>
        </div>
      `,
    });

    if (error) {
      console.error('⚠️ [Resend] API Error:', error.message);
      return false; // Return false so the app knows it failed, but doesn't crash
    }

    console.log(`📧 [Resend] Confirmation email sent successfully to ${email}`);
    return true;

  } catch (err) {
    // We catch and log the error, but DO NOT throw it.
    // If an email fails, we still want the customer to successfully join the database queue.
    console.error('⚠️ [Resend] Unexpected error sending email:', err);
    return false;
  }
};