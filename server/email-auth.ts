import { Express, Request, Response } from "express";
import { z } from "zod";
import crypto from "crypto";
import { storage } from "./storage";
import { sendMagicLink, sendOtpCode } from "./email";

const MAGIC_LINK_EXPIRY_MINUTES = 15;
const OTP_EXPIRY_MINUTES = 10;
const REVERIFICATION_DAYS = 30;

function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function generateUserId(): string {
  return `email_${crypto.randomUUID()}`;
}

const requestMagicLinkSchema = z.object({
  email: z.string().email(),
});

const verifyMagicLinkSchema = z.object({
  token: z.string().min(1),
});

const requestOtpSchema = z.object({
  email: z.string().email(),
});

const verifyOtpSchema = z.object({
  code: z.string().length(6),
});

export function registerEmailAuthRoutes(app: Express) {
  // Request magic link for login/signup
  app.post("/api/auth/email/magic-link", async (req: Request, res: Response) => {
    try {
      const { email } = requestMagicLinkSchema.parse(req.body);
      
      // Generate token
      const token = generateToken();
      const expiresAt = new Date(Date.now() + MAGIC_LINK_EXPIRY_MINUTES * 60 * 1000);
      
      // Store the token
      await storage.createMagicLinkToken({
        email,
        token,
        expiresAt,
      });
      
      // Send the email
      const sent = await sendMagicLink(email, token);
      
      if (!sent) {
        return res.status(500).json({ message: "Failed to send email" });
      }
      
      res.json({ 
        success: true, 
        message: "Check your email for a sign-in link" 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid email address" });
      }
      console.error("Magic link error:", error);
      res.status(500).json({ message: "Failed to send magic link" });
    }
  });

  // Verify magic link and establish session
  app.get("/auth/verify", async (req: Request, res: Response) => {
    try {
      const { token } = verifyMagicLinkSchema.parse(req.query);
      
      // Find the token
      const magicToken = await storage.getMagicLinkToken(token);
      
      if (!magicToken) {
        return res.redirect("/?error=invalid_or_expired_link");
      }
      
      // Mark token as used
      await storage.markMagicLinkUsed(token);
      
      // Check if user exists
      let identity = await storage.getEmailIdentityByEmail(magicToken.email);
      
      if (!identity) {
        // Create new user
        const userId = generateUserId();
        
        identity = await storage.createEmailIdentity({
          email: magicToken.email,
          userId,
          emailVerified: true,
          lastVerifiedAt: new Date(),
        });
        
        // Create user profile with defaults (they'll complete onboarding)
        await storage.createUserProfile({
          userId,
          currentNodeId: "z1-n1",
          unlockedNodeIds: ["z1-n1"],
          completedNodeIds: [],
        });
      } else {
        // Update verification timestamp
        await storage.updateEmailIdentity(magicToken.email, {
          emailVerified: true,
          lastVerifiedAt: new Date(),
        });
      }
      
      // Set session
      (req.session as any).userId = identity.userId;
      (req.session as any).email = identity.email;
      (req.session as any).lastVerifiedAt = new Date().toISOString();
      
      // Redirect to app
      res.redirect("/");
    } catch (error) {
      console.error("Verify magic link error:", error);
      res.redirect("/?error=verification_failed");
    }
  });

  // Request OTP for 30-day re-verification
  app.post("/api/auth/email/request-otp", async (req: Request, res: Response) => {
    try {
      const userId = (req.session as any)?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const identity = await storage.getEmailIdentityByUserId(userId);
      if (!identity) {
        return res.status(404).json({ message: "Email not found" });
      }
      
      // Generate OTP
      const code = generateOtp();
      const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
      
      await storage.createOtpCode({
        userId,
        code,
        expiresAt,
      });
      
      // Send OTP email
      const sent = await sendOtpCode(identity.email, code);
      
      if (!sent) {
        return res.status(500).json({ message: "Failed to send OTP" });
      }
      
      res.json({ 
        success: true,
        message: "Verification code sent to your email"
      });
    } catch (error) {
      console.error("Request OTP error:", error);
      res.status(500).json({ message: "Failed to send verification code" });
    }
  });

  // Verify OTP
  app.post("/api/auth/email/verify-otp", async (req: Request, res: Response) => {
    try {
      const userId = (req.session as any)?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const { code } = verifyOtpSchema.parse(req.body);
      
      const otpCode = await storage.getValidOtpCode(userId, code);
      
      if (!otpCode) {
        return res.status(400).json({ message: "Invalid or expired code" });
      }
      
      // Mark OTP as used
      await storage.markOtpUsed(otpCode.id);
      
      // Update verification timestamp
      const identity = await storage.getEmailIdentityByUserId(userId);
      if (identity) {
        await storage.updateEmailIdentity(identity.email, {
          lastVerifiedAt: new Date(),
        });
      }
      
      // Update session
      (req.session as any).lastVerifiedAt = new Date().toISOString();
      
      res.json({ success: true });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid code format" });
      }
      console.error("Verify OTP error:", error);
      res.status(500).json({ message: "Failed to verify code" });
    }
  });

  // Get current email auth status
  app.get("/api/auth/email/status", async (req: Request, res: Response) => {
    try {
      const userId = (req.session as any)?.userId;
      const email = (req.session as any)?.email;
      const lastVerifiedAt = (req.session as any)?.lastVerifiedAt;
      
      if (!userId || !email) {
        return res.json({ 
          authenticated: false,
          needsReverification: false 
        });
      }
      
      // Check if re-verification is needed (30 days)
      let needsReverification = false;
      if (lastVerifiedAt) {
        const verifiedDate = new Date(lastVerifiedAt);
        const daysSinceVerification = (Date.now() - verifiedDate.getTime()) / (1000 * 60 * 60 * 24);
        needsReverification = daysSinceVerification >= REVERIFICATION_DAYS;
      }
      
      res.json({
        authenticated: true,
        email,
        userId,
        needsReverification,
      });
    } catch (error) {
      console.error("Auth status error:", error);
      res.status(500).json({ message: "Failed to get auth status" });
    }
  });

  // Email auth logout
  app.post("/api/auth/email/logout", (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ message: "Failed to logout" });
      }
      res.json({ success: true });
    });
  });
}

// Middleware to check if re-verification is needed
export function requireReverification(req: Request, res: Response, next: Function) {
  const lastVerifiedAt = (req.session as any)?.lastVerifiedAt;
  
  if (!lastVerifiedAt) {
    return res.status(403).json({ 
      message: "Verification required",
      needsReverification: true 
    });
  }
  
  const verifiedDate = new Date(lastVerifiedAt);
  const daysSinceVerification = (Date.now() - verifiedDate.getTime()) / (1000 * 60 * 60 * 24);
  
  if (daysSinceVerification >= REVERIFICATION_DAYS) {
    return res.status(403).json({ 
      message: "Re-verification required",
      needsReverification: true 
    });
  }
  
  next();
}
