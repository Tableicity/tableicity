import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Building2, Loader2, X, Cookie } from "lucide-react";
import { SiGoogle } from "react-icons/si";
import { AuthBackground } from "@/components/auth-background";

const glassCard = "w-full max-w-[420px] rounded-2xl p-8 border border-[rgba(99,179,237,0.2)] shadow-[0_25px_60px_rgba(0,0,0,0.5),0_0_0_1px_rgba(99,179,237,0.08)] backdrop-blur-[20px]";
const glassCardBg = { background: "rgba(13, 20, 35, 0.92)" };
const glassInput = "w-full bg-[rgba(255,255,255,0.06)] border-[rgba(99,179,237,0.2)] text-[#E2E8F0] placeholder:text-[#4A5568] rounded-lg focus:border-[#63B3ED] focus:ring-2 focus:ring-[rgba(99,179,237,0.2)] focus-visible:ring-[rgba(99,179,237,0.2)] focus-visible:border-[#63B3ED]";
const glassLabel = "text-[#A0AEC0] text-[0.8rem] font-medium";

export default function RegisterPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [googleAvailable, setGoogleAvailable] = useState(false);
  const [showCookieConsent, setShowCookieConsent] = useState(false);
  const [pendingRegister, setPendingRegister] = useState(false);
  const { register } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  useEffect(() => {
    fetch("/api/auth/google/available")
      .then(r => r.json())
      .then(d => setGoogleAvailable(d.available))
      .catch(() => {});
  }, []);

  const cookieHandled = () => {
    const v = localStorage.getItem("cookie-consent-accepted");
    if (v === "true" || v === "rejected") return true;
    if (localStorage.getItem("cookie-consent-dismissed") === "true") return true;
    return false;
  };

  const doRegister = async () => {
    if (password !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure both passwords are the same.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await register({ email, password, firstName, lastName });
      const lc = (result as any).lab_code;
      setLocation(lc ? `/verify-email?lc=${lc}` : "/verify-email");
    } catch (error: any) {
      toast({
        title: "Registration Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    if (!cookieHandled()) {
      setPendingRegister(true);
      setShowCookieConsent(true);
      return;
    }
    doRegister();
  };

  const handleCookieAccept = () => {
    localStorage.setItem("cookie-consent-accepted", "true");
    setShowCookieConsent(false);
    if (pendingRegister) {
      setPendingRegister(false);
      doRegister();
    }
  };

  const handleCookieReject = () => {
    localStorage.setItem("cookie-consent-accepted", "rejected");
    setShowCookieConsent(false);
    if (pendingRegister) {
      setPendingRegister(false);
      doRegister();
    }
  };

  const handleGoogleSignup = () => {
    window.location.href = "/api/auth/google";
  };

  return (
    <AuthBackground>
      <div className={glassCard} style={glassCardBg} data-testid="card-register">
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
            Create your account
          </p>
        </div>

        <div className="space-y-4">
          {googleAvailable && (
            <>
              <Button
                variant="outline"
                className="w-full bg-[rgba(255,255,255,0.06)] border-[rgba(99,179,237,0.2)] text-[#E2E8F0] hover:bg-[rgba(255,255,255,0.1)] hover:text-white focus-visible:ring-[rgba(99,179,237,0.3)]"
                onClick={handleGoogleSignup}
                data-testid="button-google-signup"
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
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="firstName" className={glassLabel}>First Name</Label>
                <Input
                  id="firstName"
                  placeholder="First"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  className={glassInput}
                  data-testid="input-first-name"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lastName" className={glassLabel}>Last Name</Label>
                <Input
                  id="lastName"
                  placeholder="Last"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  className={glassInput}
                  data-testid="input-last-name"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email" className={glassLabel}>Email</Label>
              <Input
                id="email"
                type="email"
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
                placeholder="Min 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className={glassInput}
                data-testid="input-password"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword" className={glassLabel}>Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                className={glassInput}
                data-testid="input-confirm-password"
              />
            </div>
            <div className="relative" style={{ overflow: "visible" }}>
              <Button
                type="submit"
                className="w-full bg-[#2B6CB0] hover:bg-[#2C5282] text-white font-semibold rounded-lg focus-visible:ring-[rgba(99,179,237,0.4)]"
                disabled={isLoading}
                data-testid="button-register"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Account"}
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
                        onClick={() => { setShowCookieConsent(false); setPendingRegister(false); }}
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

          <div className="text-center pt-2">
            <p className="text-[#718096] text-[0.8rem]">
              Already have an account?{" "}
              <Link href="/login" className="text-[#63B3ED] font-medium hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(99,179,237,0.3)] focus-visible:rounded-sm" data-testid="link-login">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </AuthBackground>
  );
}
