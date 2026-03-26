import { useState, useEffect, useRef } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Building2, Loader2, ShieldCheck, RefreshCw, X, Cookie } from "lucide-react";
import { SiGoogle } from "react-icons/si";
import { AuthBackground } from "@/components/auth-background";
import { OtpInput } from "@/components/otp-input";

const glassCard = "w-full max-w-[420px] rounded-2xl p-8 border border-[rgba(99,179,237,0.2)] shadow-[0_25px_60px_rgba(0,0,0,0.5),0_0_0_1px_rgba(99,179,237,0.08)] backdrop-blur-[20px]";
const glassCardBg = { background: "rgba(13, 20, 35, 0.92)" };

const glassInput = "w-full bg-[rgba(255,255,255,0.06)] border-[rgba(99,179,237,0.2)] text-[#E2E8F0] placeholder:text-[#4A5568] rounded-lg focus:border-[#63B3ED] focus:ring-2 focus:ring-[rgba(99,179,237,0.2)] focus-visible:ring-[rgba(99,179,237,0.2)] focus-visible:border-[#63B3ED]";

const glassLabel = "text-[#A0AEC0] text-[0.8rem] font-medium";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [googleAvailable, setGoogleAvailable] = useState(false);
  const [mfaStep, setMfaStep] = useState(false);
  const [maskedEmail, setMaskedEmail] = useState("");
  const [labCode, setLabCode] = useState("");
  const [otpError, setOtpError] = useState("");
  const [otpReset, setOtpReset] = useState(0);
  const [showCookieConsent, setShowCookieConsent] = useState(false);
  const [pendingLogin, setPendingLogin] = useState(false);
  const signInRef = useRef<HTMLButtonElement>(null);
  const { login, verifyLoginMfa, resendLoginCode, user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (user && !user.requiresVerification) {
      setLocation("/");
    }
  }, [user, setLocation]);

  useEffect(() => {
    fetch("/api/auth/google/available")
      .then(r => r.json())
      .then(d => setGoogleAvailable(d.available))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("mfa") === "true") {
      const emailParam = params.get("email");
      if (emailParam) {
        setMaskedEmail(decodeURIComponent(emailParam));
        setMfaStep(true);
      }
    }
  }, []);

  const cookieHandled = () => {
    const v = localStorage.getItem("cookie-consent-accepted");
    if (v === "true" || v === "rejected") return true;
    if (localStorage.getItem("cookie-consent-dismissed") === "true") return true;
    return false;
  };

  const doLogin = async () => {
    setIsLoading(true);
    try {
      const result = await login(email, password);
      if ("requiresMfa" in result && result.requiresMfa) {
        setMaskedEmail(result.maskedEmail);
        setLabCode(result.lab_code || "");
        setMfaStep(true);
      } else {
        setLocation("/");
      }
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isLoading) return;
    if (!cookieHandled()) {
      setPendingLogin(true);
      setShowCookieConsent(true);
      return;
    }
    doLogin();
  };

  const handleCookieAccept = () => {
    localStorage.setItem("cookie-consent-accepted", "true");
    setShowCookieConsent(false);
    if (pendingLogin) {
      setPendingLogin(false);
      doLogin();
    }
  };

  const handleCookieReject = () => {
    localStorage.setItem("cookie-consent-accepted", "rejected");
    setShowCookieConsent(false);
    if (pendingLogin) {
      setPendingLogin(false);
      doLogin();
    }
  };

  const handleOtpComplete = async (code: string) => {
    setOtpError("");
    setIsVerifying(true);
    try {
      await verifyLoginMfa(code);
      setLocation("/");
    } catch (error: any) {
      setOtpError(error.message || "Invalid or expired code");
      setOtpReset(r => r + 1);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendCode = async () => {
    setIsResending(true);
    setOtpError("");
    try {
      const data = await resendLoginCode();
      if (data.lab_code) {
        setLabCode(data.lab_code);
      }
      setOtpReset(r => r + 1);
      toast({
        title: "Code Sent",
        description: "A new security code has been sent to your email.",
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

  const handleBackToLogin = () => {
    setMfaStep(false);
    setLabCode("");
    setOtpError("");
    setPassword("");
    setOtpReset(r => r + 1);
  };

  const handleGoogleLogin = () => {
    window.location.href = "/api/auth/google";
  };

  if (mfaStep) {
    return (
      <AuthBackground variant="mfa">
        <div className={glassCard} style={glassCardBg} data-testid="card-mfa">
          <div className="text-center mb-6">
            <div className="flex justify-center mb-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-[10px] bg-[rgba(99,179,237,0.15)] border border-[rgba(99,179,237,0.3)]">
                <ShieldCheck className="h-6 w-6 text-[#63B3ED]" />
              </div>
            </div>
            <h2 className="text-[22px] font-bold text-white mb-1" data-testid="text-otp-title">
              Verify Your Identity
            </h2>
            <p className="text-[13px] text-[#A0AEC0]">
              A 6-digit code was sent to:
            </p>
            <p className="text-[14px] font-bold text-[#63B3ED] mt-1" data-testid="text-masked-email">
              {maskedEmail}
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
              onClick={handleResendCode}
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

          <div className="text-center mb-3">
            <button
              type="button"
              onClick={handleBackToLogin}
              className="text-[#718096] text-[0.8rem] hover:text-[#A0AEC0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(99,179,237,0.3)] focus-visible:rounded-sm transition-colors cursor-pointer bg-transparent border-none"
              data-testid="button-cancel-mfa"
            >
              &larr; Back to login
            </button>
          </div>

          <p className="text-[#718096] text-[0.75rem] text-center">
            {labCode
              ? "Code expires in 10 minutes. Enter your code above."
              : "Code expires in 10 minutes. Check Replit Logs for delivery."}
          </p>
        </div>
      </AuthBackground>
    );
  }

  return (
    <AuthBackground>
      <div className={glassCard} style={glassCardBg} data-testid="card-login">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-[10px] bg-[rgba(99,179,237,0.15)] border border-[rgba(99,179,237,0.3)]">
              <Building2 className="h-6 w-6 text-[#63B3ED]" />
            </div>
            <span className="text-[11px] font-bold tracking-wide text-yellow-400 border border-yellow-400/40 rounded-md px-2 py-0.5" data-testid="badge-beta">Beta 1.01</span>
          </div>
          <h2 className="text-[22px] font-bold text-white mb-1">
            TABLEICITY
          </h2>
          <p className="text-[#718096] text-[13px]">
            Equity Management for Startups
          </p>
        </div>

        <div className="space-y-4">
          {googleAvailable && (
            <>
              <Button
                variant="outline"
                className="w-full bg-[rgba(255,255,255,0.06)] border-[rgba(99,179,237,0.2)] text-[#E2E8F0] hover:bg-[rgba(255,255,255,0.1)] hover:text-white focus-visible:ring-[rgba(99,179,237,0.3)]"
                onClick={handleGoogleLogin}
                data-testid="button-google-login"
              >
                <SiGoogle className="h-4 w-4 mr-2" />
                Continue with Google
              </Button>

              <div className="relative flex items-center my-1">
                <div className="flex-1 h-px bg-[rgba(99,179,237,0.15)]" />
                <span className="px-3 text-[#718096] text-[0.7rem] uppercase tracking-wider">or</span>
                <div className="flex-1 h-px bg-[rgba(99,179,237,0.15)]" />
              </div>
            </>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className={glassLabel}>Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="username"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={glassInput}
                data-testid="input-email"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className={glassLabel}>Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={glassInput}
                data-testid="input-password"
              />
            </div>
            <div className="relative" style={{ overflow: "visible" }}>
              <Button
                ref={signInRef}
                type="submit"
                className="w-full bg-[#2B6CB0] hover:bg-[#2C5282] text-white font-semibold rounded-lg focus-visible:ring-[rgba(99,179,237,0.4)]"
                disabled={isLoading}
                data-testid="button-login"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign In"}
              </Button>

              {showCookieConsent && (
                <div
                  className="absolute bottom-full left-0 right-0 mb-3 z-50 animate-in fade-in slide-in-from-bottom-2 duration-300"
                  data-testid="card-cookie-consent"
                >
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 rotate-45" style={{ background: "rgba(13, 20, 35, 0.95)", border: "1px solid rgba(99,179,237,0.25)", borderTop: "none", borderLeft: "none" }} />
                  <div className="relative rounded-lg shadow-[0_15px_40px_rgba(0,0,0,0.4)] border border-[rgba(99,179,237,0.25)] overflow-hidden" style={{ background: "rgba(13, 20, 35, 0.95)" }}>
                    <div className="h-1 bg-[#2B6CB0]" />
                    <div className="p-4">
                      <button
                        type="button"
                        onClick={() => { setShowCookieConsent(false); setPendingLogin(false); }}
                        className="absolute top-2.5 right-2.5 p-1 rounded-full hover:bg-[rgba(255,255,255,0.1)] text-[#718096] hover:text-[#A0AEC0] transition-colors"
                        data-testid="button-cookie-dismiss"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                      <div className="flex items-start gap-3 pr-6">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[rgba(99,179,237,0.15)] border border-[rgba(99,179,237,0.25)] shrink-0 mt-0.5">
                          <Cookie className="h-4 w-4 text-[#63B3ED]" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-sm text-white mb-1">We value your privacy</h3>
                          <p className="text-[0.75rem] text-[#A0AEC0] leading-relaxed">
                            We use cookies to enhance your browsing experience and analyse our traffic. By clicking "Accept", you consent to our use of cookies.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5 mt-3.5">
                        <button
                          type="button"
                          onClick={handleCookieReject}
                          className="flex-1 py-1.5 rounded-lg text-[0.8rem] font-medium border border-[rgba(99,179,237,0.2)] text-[#A0AEC0] hover:text-white hover:border-[rgba(99,179,237,0.4)] transition-colors"
                          data-testid="button-cookie-reject"
                        >
                          Reject All
                        </button>
                        <button
                          type="button"
                          onClick={handleCookieAccept}
                          className="flex-1 py-1.5 rounded-lg text-[0.8rem] font-medium bg-[#2B6CB0] hover:bg-[#2C5282] text-white transition-colors"
                          data-testid="button-cookie-accept"
                        >
                          Accept All
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </form>

          <div className="text-center pt-2 space-y-2">
            <p className="text-[#718096] text-[0.8rem]">
              Don't have an account?{" "}
              <Link href="/register" className="text-[#63B3ED] font-medium hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(99,179,237,0.3)] focus-visible:rounded-sm" data-testid="link-register">
                Create one
              </Link>
            </p>
            <p className="text-[#718096] text-[0.8rem]">
              Or{" "}
              <Link href="/launch" className="text-[#48BB78] font-medium hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(72,187,120,0.3)] focus-visible:rounded-sm" data-testid="link-trial">
                Start a Free Trial
              </Link>
            </p>
          </div>
        </div>
      </div>
    </AuthBackground>
  );
}
