import { useState } from "react";
import { useLocation } from "wouter";
import { Building2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { AuthBackground } from "@/components/auth-background";

const glassCard = "w-full max-w-[420px] rounded-2xl p-8 border border-[rgba(99,179,237,0.2)] shadow-[0_25px_60px_rgba(0,0,0,0.5),0_0_0_1px_rgba(99,179,237,0.08)] backdrop-blur-[20px]";
const glassCardBg = { background: "rgba(13, 20, 35, 0.92)" };
const glassInput = "w-full bg-[rgba(255,255,255,0.06)] border-[rgba(99,179,237,0.2)] text-[#E2E8F0] placeholder:text-[#4A5568] rounded-lg focus:border-[#63B3ED] focus:ring-2 focus:ring-[rgba(99,179,237,0.2)] focus-visible:ring-[rgba(99,179,237,0.2)] focus-visible:border-[#63B3ED] h-10 px-3 text-sm";
const glassLabel = "text-[#A0AEC0] text-[0.8rem] font-medium";

export default function LaunchPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [companyName, setCompanyName] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
      const res = await apiRequest("POST", "/api/trial-signup", {
        fullName,
        email,
        phone,
        companyName,
      });
      const data = await res.json();

      if (data.alreadyExists && data.hasAccount) {
        toast({
          title: "Account exists",
          description: "You already have an account. Redirecting to sign in.",
        });
        navigate("/login");
        return;
      }

      const params = new URLSearchParams({
        email: data.email,
        name: data.fullName,
      });
      navigate(`/launch/thank-you?${params.toString()}`);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthBackground>
      <div className={glassCard} style={glassCardBg} data-testid="card-trial-signup">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-[10px] bg-[rgba(99,179,237,0.15)] border border-[rgba(99,179,237,0.3)]">
              <Building2 className="h-6 w-6 text-[#63B3ED]" />
            </div>
            <span className="text-[11px] font-bold tracking-wide text-yellow-400 border border-yellow-400/40 rounded-md px-2 py-0.5" data-testid="badge-beta">Beta 1.01</span>
          </div>
          <h2 className="text-[22px] font-bold text-white mb-1" data-testid="text-signup-title">Start Your Free Trial</h2>
          <p className="text-[#718096] text-[13px]">Get your cap table running in under 5 minutes</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="firstName" className={glassLabel}>First Name *</label>
              <input
                id="firstName"
                placeholder="John"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                autoComplete="given-name"
                className={glassInput}
                data-testid="input-first-name"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="lastName" className={glassLabel}>Last Name *</label>
              <input
                id="lastName"
                placeholder="Smith"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                autoComplete="family-name"
                className={glassInput}
                data-testid="input-last-name"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="email" className={glassLabel}>Email *</label>
            <input
              id="email"
              type="email"
              placeholder="john.smith@acme.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className={glassInput}
              data-testid="input-email"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="phone" className={glassLabel}>Phone Number *</label>
            <input
              id="phone"
              type="tel"
              placeholder="(909) 442-0099"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              autoComplete="tel"
              className={glassInput}
              data-testid="input-phone"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="companyName" className={glassLabel}>Company Name *</label>
            <input
              id="companyName"
              placeholder="Acme, Inc."
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              required
              autoComplete="organization"
              className={glassInput}
              data-testid="input-company-name"
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-[#2B6CB0] hover:bg-[#2C5282] text-white h-11 font-semibold rounded-lg"
            disabled={isSubmitting}
            data-testid="button-start-trial"
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Start Free Trial"}
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
