import { useState } from "react";
import { useLocation, useSearch } from "wouter";
import { Building2, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { AuthBackground } from "@/components/auth-background";

const glassCard = "w-full max-w-[420px] rounded-2xl p-8 border border-[rgba(99,179,237,0.2)] shadow-[0_25px_60px_rgba(0,0,0,0.5),0_0_0_1px_rgba(99,179,237,0.08)] backdrop-blur-[20px]";
const glassCardBg = { background: "rgba(13, 20, 35, 0.92)" };
const glassInput = "w-full bg-[rgba(255,255,255,0.06)] border-[rgba(99,179,237,0.2)] text-[#E2E8F0] placeholder:text-[#4A5568] rounded-lg focus:border-[#63B3ED] focus:ring-2 focus:ring-[rgba(99,179,237,0.2)] focus-visible:ring-[rgba(99,179,237,0.2)] focus-visible:border-[#63B3ED] h-10 px-3 text-sm border";
const glassInputDisabled = "w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(99,179,237,0.1)] text-[#718096] rounded-lg h-10 px-3 text-sm cursor-not-allowed";
const glassLabel = "text-[#A0AEC0] text-[0.8rem] font-medium";

export default function LaunchCreatePasswordPage() {
  const [, navigate] = useLocation();
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const prefillEmail = params.get("email") || "";
  const prefillName = params.get("name") || "";
  const { toast } = useToast();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!agreedToTerms) {
      toast({
        title: "Terms required",
        description: "You must agree to the Terms of Service and Privacy Policy.",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 8) {
      toast({
        title: "Password too short",
        description: "Password must be at least 8 characters.",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure both passwords are the same.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await apiRequest("POST", "/api/trial-create-account", {
        email: prefillEmail,
        password,
        agreedToTerms,
      });
      const data = await res.json();

      const p = new URLSearchParams({ email: data.email || prefillEmail });
      navigate(`/launch/check-email?${p.toString()}`);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthBackground>
      <div className={glassCard} style={glassCardBg} data-testid="card-create-password">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-[10px] bg-[rgba(99,179,237,0.15)] border border-[rgba(99,179,237,0.3)]">
              <Building2 className="h-6 w-6 text-[#63B3ED]" />
            </div>
            <span className="text-[11px] font-bold tracking-wide text-yellow-400 border border-yellow-400/40 rounded-md px-2 py-0.5" data-testid="badge-beta">Beta 1.01</span>
          </div>
          <h2 className="text-[22px] font-bold text-white mb-1" data-testid="text-signup-title">Sign Up to Tableicity</h2>
          <p className="text-[#718096] text-[13px]">Create your account credentials</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="fullName" className={glassLabel}>Full Name</label>
            <input
              id="fullName"
              value={prefillName}
              disabled
              className={glassInputDisabled}
              data-testid="input-full-name"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="email" className={glassLabel}>Email</label>
            <input
              id="email"
              type="email"
              value={prefillEmail}
              disabled
              className={glassInputDisabled}
              data-testid="input-email"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className={glassLabel}>Password *</label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter password here"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                className={`${glassInput} pr-10`}
                data-testid="input-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#718096] hover:text-[#A0AEC0] transition-colors"
                data-testid="button-toggle-password"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="confirmPassword" className={glassLabel}>Confirm Password *</label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                className={`${glassInput} pr-10`}
                data-testid="input-confirm-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#718096] hover:text-[#A0AEC0] transition-colors"
                data-testid="button-toggle-confirm-password"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <div className="mt-0.5">
              <input
                type="checkbox"
                id="terms"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="h-4 w-4 rounded border-[rgba(99,179,237,0.3)] bg-[rgba(255,255,255,0.06)] text-[#2B6CB0] focus:ring-[rgba(99,179,237,0.2)] cursor-pointer accent-[#2B6CB0]"
                data-testid="checkbox-terms"
              />
            </div>
            <label htmlFor="terms" className="text-[0.8rem] text-[#A0AEC0] leading-relaxed cursor-pointer">
              I agree to the{" "}
              <span className="text-[#63B3ED] hover:text-[#90CDF4]">Terms of Service</span>{" "}
              and{" "}
              <span className="text-[#63B3ED] hover:text-[#90CDF4]">Privacy Policy</span>
            </label>
          </div>

          <Button
            type="submit"
            className="w-full bg-[#2B6CB0] hover:bg-[#2C5282] text-white h-11 font-semibold rounded-lg"
            disabled={isSubmitting || !agreedToTerms || password.length < 8 || password !== confirmPassword}
            data-testid="button-signup"
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign Up"}
          </Button>

          <p className="text-center text-[0.8rem] text-[#718096]">
            Already have an account?{" "}
            <a href="/login" className="text-[#63B3ED] hover:text-[#90CDF4] transition-colors" data-testid="link-sign-in">
              Sign In
            </a>
          </p>
        </form>
      </div>
    </AuthBackground>
  );
}
