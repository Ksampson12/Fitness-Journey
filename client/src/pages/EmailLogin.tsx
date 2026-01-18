import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, ArrowLeft, Loader2, CheckCircle, Shield } from "lucide-react";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";

type Stage = "email" | "sent" | "otp" | "error";

async function postJson(url: string, data: object): Promise<any> {
  const res = await apiRequest("POST", url, data);
  return res.json();
}

export default function EmailLogin() {
  const [, navigate] = useLocation();
  const [stage, setStage] = useState<Stage>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRequestMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setIsLoading(true);
    setError("");
    
    try {
      const res = await postJson("/api/auth/email/magic-link", { email });
      
      if (res.success) {
        setStage("sent");
      } else {
        setError(res.message || "Failed to send login link");
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) return;
    
    setIsLoading(true);
    setError("");
    
    try {
      const res = await postJson("/api/auth/email/verify-otp", { code: otp });
      
      if (res.success) {
        window.location.href = "/";
      } else {
        setError(res.message || "Invalid code");
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (value: string) => {
    const cleaned = value.replace(/\D/g, "").slice(0, 6);
    setOtp(cleaned);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-[500px] bg-primary/5 blur-[100px] rounded-full -translate-y-1/2 pointer-events-none" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md z-10"
      >
        <Card className="border-white/10 bg-card/50 backdrop-blur-sm">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-4 w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              {stage === "otp" ? (
                <Shield className="w-8 h-8 text-primary" />
              ) : (
                <Mail className="w-8 h-8 text-primary" />
              )}
            </div>
            <CardTitle className="text-2xl font-display">
              {stage === "email" && "Sign In"}
              {stage === "sent" && "Check Your Email"}
              {stage === "otp" && "Enter Code"}
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              {stage === "email" && "Enter your email to receive a sign-in link"}
              {stage === "sent" && `We sent a link to ${email}`}
              {stage === "otp" && "Enter the 6-digit verification code"}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <AnimatePresence mode="wait">
              {stage === "email" && (
                <motion.form
                  key="email"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  onSubmit={handleRequestMagicLink}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Input
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-12 text-lg"
                      data-testid="input-email"
                      autoComplete="email"
                      autoFocus
                    />
                  </div>

                  {error && (
                    <p className="text-sm text-destructive" data-testid="text-error">{error}</p>
                  )}

                  <Button 
                    type="submit" 
                    className="w-full h-12 text-lg" 
                    disabled={!email || isLoading}
                    data-testid="button-send-link"
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>Send Sign In Link</>
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full"
                    onClick={() => navigate("/")}
                    data-testid="button-back"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back
                  </Button>
                </motion.form>
              )}

              {stage === "sent" && (
                <motion.div
                  key="sent"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-4 text-center"
                >
                  <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <CheckCircle className="w-8 h-8 text-primary" />
                  </div>
                  
                  <p className="text-muted-foreground">
                    Click the link in the email to sign in. The link expires in 15 minutes.
                  </p>

                  <div className="pt-4 space-y-2">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        setStage("email");
                        setError("");
                      }}
                      data-testid="button-try-different"
                    >
                      Use a different email
                    </Button>
                    
                    <Button
                      variant="ghost"
                      className="w-full text-muted-foreground"
                      onClick={handleRequestMagicLink}
                      disabled={isLoading}
                      data-testid="button-resend"
                    >
                      {isLoading ? "Sending..." : "Resend link"}
                    </Button>
                  </div>
                </motion.div>
              )}

              {stage === "otp" && (
                <motion.form
                  key="otp"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  onSubmit={handleVerifyOtp}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Input
                      type="text"
                      inputMode="numeric"
                      placeholder="000000"
                      value={otp}
                      onChange={(e) => handleOtpChange(e.target.value)}
                      className="h-16 text-3xl text-center tracking-[0.5em] font-mono"
                      data-testid="input-otp"
                      autoComplete="one-time-code"
                      autoFocus
                    />
                  </div>

                  {error && (
                    <p className="text-sm text-destructive text-center" data-testid="text-error">{error}</p>
                  )}

                  <Button 
                    type="submit" 
                    className="w-full h-12 text-lg" 
                    disabled={otp.length !== 6 || isLoading}
                    data-testid="button-verify"
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>Verify</>
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full text-muted-foreground"
                    onClick={async () => {
                      setIsLoading(true);
                      try {
                        await apiRequest("POST", "/api/auth/email/request-otp", {});
                      } catch {}
                      setIsLoading(false);
                    }}
                    disabled={isLoading}
                    data-testid="button-resend-otp"
                  >
                    {isLoading ? "Sending..." : "Resend code"}
                  </Button>
                </motion.form>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          By signing in, you agree to our Terms of Service and Privacy Policy.
        </p>
      </motion.div>
    </div>
  );
}
