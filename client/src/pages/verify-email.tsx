import { useState, useCallback } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ShieldCheck, RefreshCw, ArrowLeft } from "lucide-react";
import { AuthBackground } from "@/components/auth-background";
import { OtpInput } from "@/components/otp-input";
import { apiRequest } from "@/lib/queryClient";

const glassCard = "w-full max-w-[420px] rounded-2xl p-8 border border-[rgba(99,179,237,0.2)] shadow-[0_25px_60px_rgba(0,0,0,0.5),0_0_0_1px_rgba(99,179,237,0.08)] backdrop-blur-[20px]";
const glassCardBg = { background: "rgba(13, 20, 35, 0.92)" };

function getInitialLabCode(): string {
  const params = new URLSearchParams(window.location.search);
  return params.get("lc") || "";
}

export default function VerifyEmailPage() {
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [otpReset, setOtpReset] = useState(0);
  const [labCode, setLabCode] = useState(getInitialLabCode);
  const { user, verifyEmail, resendCode } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const handleOtpComplete = useCallback(async (code: string) => {
    setIsVerifying(true);
    setOtpError("");
    try {
      await verifyEmail(code);
      toast({
        title: "Email Verified",
        description: "Your account has been verified successfully.",
      });
      setLocation("/");
    } catch (error: any) {
      setOtpError(error.message || "Invalid code");
      setOtpReset(r => r + 1);
    } finally {
      setIsVerifying(false);
    }
  }, [verifyEmail, toast, setLocation]);

  const handleResend = async () => {
    setIsResending(true);
    try {
      const res = await apiRequest("POST", "/api/auth/resend-code");
      const data = await res.json();
      if (data.lab_code) {
        setLabCode(data.lab_code);
      }
      toast({
        title: "Code Sent",
        description: "A new verification code has been sent to your email.",
      });
    } catch (error: any) {
      toast({
        title: "Could Not Send Code",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <AuthBackground>
      <div className={glassCard} style={glassCardBg} data-testid="card-verify-email">
        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-[10px] bg-[rgba(99,179,237,0.15)] border border-[rgba(99,179,237,0.3)]">
              <ShieldCheck className="h-6 w-6 text-[#63B3ED]" />
            </div>
          </div>
          <h2 className="text-[22px] font-bold text-white mb-1" data-testid="text-verify-title">
            Verify Your Email
          </h2>
          <p className="text-[13px] text-[#A0AEC0]">
            A 6-digit code was sent to:
          </p>
          <p className="text-[14px] font-bold text-[#63B3ED] mt-1" data-testid="text-user-email">
            {user?.email || "your email"}
          </p>
        </div>

        <div className="mb-6">
          <OtpInput
            onComplete={handleOtpComplete}
            disabled={isVerifying}
            error={otpError}
            reset={otpReset}
          />
        </div>

        {isVerifying && (
          <p className="text-[#63B3ED] text-[0.85rem] text-center mb-3" data-testid="text-verifying">
            Verifying...
          </p>
        )}

        {labCode && (
          <div
            className="rounded-lg border border-[rgba(99,179,237,0.25)] text-center mb-3"
            style={{
              background: "rgba(99,179,237,0.08)",
              padding: "10px 16px",
            }}
            data-testid="lab-code-display"
          >
            <p className="text-[#A0AEC0] text-[0.7rem] uppercase tracking-wider mb-1">
              Lab Mode — Your Code
            </p>
            <p
              className="text-[#63B3ED] text-2xl font-bold font-mono tracking-[6px]"
              data-testid="text-lab-code"
            >
              {labCode}
            </p>
          </div>
        )}

        <div className="text-center mb-3">
          <p className="text-[#718096] text-[0.8rem] mb-3">Didn't receive a code?</p>
          <button
            type="button"
            onClick={handleResend}
            disabled={isResending}
            className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(99,179,237,0.3)] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: "none",
              border: "1px solid rgba(99,179,237,0.3)",
              borderRadius: "8px",
              color: "#63B3ED",
              padding: "8px 20px",
              fontSize: "0.8rem",
              fontWeight: 600,
              cursor: isResending ? "not-allowed" : "pointer",
            }}
            onMouseEnter={(e) => { (e.target as HTMLButtonElement).style.background = "rgba(99,179,237,0.1)"; }}
            onMouseLeave={(e) => { (e.target as HTMLButtonElement).style.background = "none"; }}
            data-testid="button-resend-code"
          >
            {isResending && <RefreshCw className="h-3 w-3 animate-spin inline mr-1.5" />}
            Resend Code
          </button>
        </div>

        <p className="text-[#718096] text-[0.75rem] text-center">
          Code expires in 10 minutes. Check your inbox or spam folder.
        </p>

        <div className="text-center mt-4">
          <Link
            href="/login"
            className="text-[#718096] text-[0.8rem] hover:text-[#A0AEC0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(99,179,237,0.3)] focus-visible:rounded-sm transition-colors inline-flex items-center gap-1.5"
            data-testid="button-back-to-login"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to login
          </Link>
        </div>
      </div>
    </AuthBackground>
  );
}
