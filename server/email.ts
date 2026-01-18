import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = 'FitQuest <noreply@resend.dev>';

export async function sendMagicLink(email: string, token: string): Promise<boolean> {
  const magicLink = `${process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : 'http://localhost:5000'}/auth/verify?token=${token}`;
  
  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: 'Sign in to FitQuest',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
          <h1 style="color: #1a1a2e; font-size: 24px; margin-bottom: 24px;">Sign in to FitQuest</h1>
          <p style="color: #4a4a68; font-size: 16px; line-height: 1.6; margin-bottom: 32px;">
            Click the button below to sign in to your account. This link will expire in 15 minutes.
          </p>
          <a href="${magicLink}" style="display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
            Sign In
          </a>
          <p style="color: #9a9ab8; font-size: 14px; margin-top: 32px;">
            If you didn't request this email, you can safely ignore it.
          </p>
          <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 32px 0;" />
          <p style="color: #9a9ab8; font-size: 12px;">
            This link expires in 15 minutes and can only be used once.
          </p>
        </div>
      `,
    });

    if (error) {
      console.error('Failed to send magic link email:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Error sending magic link email:', err);
    return false;
  }
}

export async function sendOtpCode(email: string, code: string): Promise<boolean> {
  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: 'Your FitQuest verification code',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
          <h1 style="color: #1a1a2e; font-size: 24px; margin-bottom: 24px;">Verification Code</h1>
          <p style="color: #4a4a68; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
            Enter this code to verify your identity:
          </p>
          <div style="background: #f5f5f7; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 32px;">
            <span style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #1a1a2e;">${code}</span>
          </div>
          <p style="color: #9a9ab8; font-size: 14px;">
            This code expires in 10 minutes. If you didn't request this, please ignore this email.
          </p>
          <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 32px 0;" />
          <p style="color: #9a9ab8; font-size: 12px;">
            For security, we ask you to verify your email every 30 days.
          </p>
        </div>
      `,
    });

    if (error) {
      console.error('Failed to send OTP email:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Error sending OTP email:', err);
    return false;
  }
}
