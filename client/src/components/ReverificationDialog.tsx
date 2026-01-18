import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Shield, Loader2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface ReverificationDialogProps {
  open: boolean;
  email?: string;
}

export function ReverificationDialog({ open, email }: ReverificationDialogProps) {
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [error, setError] = useState("");

  const handleRequestOtp = async () => {
    setIsSending(true);
    setError("");
    
    try {
      const res = await apiRequest("POST", "/api/auth/email/request-otp", {});
      const data = await res.json();
      
      if (data.success) {
        setCodeSent(true);
      } else {
        setError(data.message || "Failed to send code");
      }
    } catch (err: any) {
      setError(err.message || "Failed to send code");
    } finally {
      setIsSending(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) return;
    
    setIsLoading(true);
    setError("");
    
    try {
      const res = await apiRequest("POST", "/api/auth/email/verify-otp", { code: otp });
      const data = await res.json();
      
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: ["/api/auth/state"] });
      } else {
        setError(data.message || "Invalid code");
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
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader className="text-center pb-2">
          <div className="mx-auto mb-4 w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <DialogTitle className="text-xl">Security Verification</DialogTitle>
          <DialogDescription>
            For your security, please verify your identity. We'll send a code to {email || "your email"}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {!codeSent ? (
            <Button
              onClick={handleRequestOtp}
              className="w-full h-12"
              disabled={isSending}
              data-testid="button-send-verification"
            >
              {isSending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>Send Verification Code</>
              )}
            </Button>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                Enter the 6-digit code sent to your email
              </p>
              
              <Input
                type="text"
                inputMode="numeric"
                placeholder="000000"
                value={otp}
                onChange={(e) => handleOtpChange(e.target.value)}
                className="h-14 text-2xl text-center tracking-[0.5em] font-mono"
                data-testid="input-reverify-otp"
                autoComplete="one-time-code"
                autoFocus
              />

              {error && (
                <p className="text-sm text-destructive text-center" data-testid="text-error">{error}</p>
              )}

              <Button 
                type="submit" 
                className="w-full h-12" 
                disabled={otp.length !== 6 || isLoading}
                data-testid="button-verify-code"
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
                onClick={handleRequestOtp}
                disabled={isSending}
                data-testid="button-resend-code"
              >
                {isSending ? "Sending..." : "Resend code"}
              </Button>
            </form>
          )}

          {error && !codeSent && (
            <p className="text-sm text-destructive text-center" data-testid="text-error">{error}</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
