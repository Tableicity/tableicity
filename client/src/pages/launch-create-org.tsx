import { useState } from "react";
import { useLocation, useSearch } from "wouter";
import { Building2, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { AuthBackground } from "@/components/auth-background";

const glassCard = "w-full max-w-[420px] rounded-2xl p-8 border border-[rgba(99,179,237,0.2)] shadow-[0_25px_60px_rgba(0,0,0,0.5),0_0_0_1px_rgba(99,179,237,0.08)] backdrop-blur-[20px]";
const glassCardBg = { background: "rgba(13, 20, 35, 0.92)" };
const glassInput = "w-full bg-[rgba(255,255,255,0.06)] border border-[rgba(99,179,237,0.2)] text-[#E2E8F0] placeholder:text-[#4A5568] rounded-lg focus:border-[#63B3ED] focus:ring-2 focus:ring-[rgba(99,179,237,0.2)] focus-visible:ring-[rgba(99,179,237,0.2)] focus-visible:border-[#63B3ED] h-10 px-3 text-sm";
const glassLabel = "text-[#A0AEC0] text-[0.8rem] font-medium";
const glassSelect = "w-full bg-[rgba(255,255,255,0.06)] border border-[rgba(99,179,237,0.2)] text-[#E2E8F0] rounded-lg h-10 px-3 text-sm focus:border-[#63B3ED] focus:ring-2 focus:ring-[rgba(99,179,237,0.2)] focus:outline-none appearance-none cursor-pointer";

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "pt", label: "Portuguese" },
  { value: "zh", label: "Chinese" },
  { value: "ja", label: "Japanese" },
  { value: "ko", label: "Korean" },
];

const ORG_SIZES = [
  { value: "1-10", label: "1 - 10" },
  { value: "11-50", label: "11 - 50" },
  { value: "51-200", label: "51 - 200" },
  { value: "201-500", label: "201 - 500" },
  { value: "501+", label: "501+" },
];

const TIMEZONES = [
  { value: "America/New_York", label: "UTC-5 (EST) - New York" },
  { value: "America/Chicago", label: "UTC-6 (CST) - Chicago" },
  { value: "America/Denver", label: "UTC-7 (MST) - Denver" },
  { value: "America/Los_Angeles", label: "UTC-8 (PST) - Los Angeles" },
  { value: "America/Anchorage", label: "UTC-9 (AKST) - Anchorage" },
  { value: "Pacific/Honolulu", label: "UTC-10 (HST) - Honolulu" },
  { value: "Europe/London", label: "UTC+0 (GMT) - London" },
  { value: "Europe/Paris", label: "UTC+1 (CET) - Paris" },
  { value: "Europe/Berlin", label: "UTC+1 (CET) - Berlin" },
  { value: "Asia/Tokyo", label: "UTC+9 (JST) - Tokyo" },
  { value: "Asia/Shanghai", label: "UTC+8 (CST) - Shanghai" },
  { value: "Asia/Kolkata", label: "UTC+5:30 (IST) - Mumbai" },
  { value: "Australia/Sydney", label: "UTC+11 (AEDT) - Sydney" },
];

export default function LaunchCreateOrgPage() {
  const [, navigate] = useLocation();
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const email = params.get("email") || "";
  const orgToken = params.get("orgToken") || "";
  const { toast } = useToast();

  const [orgName, setOrgName] = useState("");
  const [phone, setPhone] = useState("");
  const [language, setLanguage] = useState("en");
  const [orgSize, setOrgSize] = useState("");
  const [timeZone, setTimeZone] = useState("America/Los_Angeles");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!orgName.trim()) {
      toast({
        title: "Required",
        description: "Organization name is required.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await apiRequest("POST", "/api/trial-create-organization", {
        name: orgName,
        phone,
        language,
        orgSize: orgSize || undefined,
        timeZone,
        orgToken,
      });
      const data = await res.json();

      localStorage.setItem("tableicty_tenant", data.tenantSlug);

      toast({
        title: "Organization created!",
        description: `${data.tenantName} is ready. Redirecting to sign in...`,
      });

      setTimeout(() => {
        navigate("/login");
      }, 1500);
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
      <div className={glassCard} style={glassCardBg} data-testid="card-create-org">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-[10px] bg-[rgba(99,179,237,0.15)] border border-[rgba(99,179,237,0.3)]">
              <Building2 className="h-6 w-6 text-[#63B3ED]" />
            </div>
            <span className="text-[11px] font-bold tracking-wide text-yellow-400 border border-yellow-400/40 rounded-md px-2 py-0.5" data-testid="badge-beta">Beta 1.01</span>
          </div>
          <h2 className="text-[22px] font-bold text-white mb-1" data-testid="text-create-org-title">
            Create Organization
          </h2>
          <p className="text-[#718096] text-[13px]">
            You can always change this later, or support multiple configurations at the same time.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="orgName" className={glassLabel}>Organization Name *</label>
            <input
              id="orgName"
              placeholder="Archer Technologies"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              required
              autoComplete="organization"
              className={glassInput}
              data-testid="input-org-name"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="orgPhone" className={glassLabel}>Phone Number</label>
            <input
              id="orgPhone"
              type="tel"
              placeholder="(909) 442-0099"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoComplete="tel"
              className={glassInput}
              data-testid="input-org-phone"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="language" className={glassLabel}>Organization Language</label>
            <select
              id="language"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className={glassSelect}
              data-testid="select-language"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.value} value={lang.value} className="bg-[#0d1423] text-[#E2E8F0]">
                  {lang.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="orgSize" className={glassLabel}>Organization Size (Optional)</label>
            <select
              id="orgSize"
              value={orgSize}
              onChange={(e) => setOrgSize(e.target.value)}
              className={glassSelect}
              data-testid="select-org-size"
            >
              <option value="" className="bg-[#0d1423] text-[#4A5568]">Select size</option>
              {ORG_SIZES.map((size) => (
                <option key={size.value} value={size.value} className="bg-[#0d1423] text-[#E2E8F0]">
                  {size.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="timeZone" className={glassLabel}>Organization Time Zone</label>
            <select
              id="timeZone"
              value={timeZone}
              onChange={(e) => setTimeZone(e.target.value)}
              className={glassSelect}
              data-testid="select-timezone"
            >
              {TIMEZONES.map((tz) => (
                <option key={tz.value} value={tz.value} className="bg-[#0d1423] text-[#E2E8F0]">
                  {tz.label}
                </option>
              ))}
            </select>
          </div>

          <Button
            type="submit"
            className="w-full bg-[#2B6CB0] hover:bg-[#2C5282] text-white h-11 font-semibold rounded-lg"
            disabled={isSubmitting || !orgName.trim()}
            data-testid="button-create-org"
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Organization"}
          </Button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="text-[0.8rem] text-[#718096] hover:text-[#A0AEC0] inline-flex items-center gap-1 transition-colors bg-transparent border-none cursor-pointer"
              data-testid="link-go-back"
            >
              <ArrowLeft className="h-3 w-3" /> Go back
            </button>
          </div>
        </form>
      </div>
    </AuthBackground>
  );
}
