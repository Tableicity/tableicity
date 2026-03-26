import { useState, useEffect, useCallback } from "react";
import { useLocation, useSearch } from "wouter";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthBackground } from "@/components/auth-background";

const glassCard = "w-full max-w-[420px] rounded-2xl p-8 border border-[rgba(99,179,237,0.2)] shadow-[0_25px_60px_rgba(0,0,0,0.5),0_0_0_1px_rgba(99,179,237,0.08)] backdrop-blur-[20px]";
const glassCardBg = { background: "rgba(13, 20, 35, 0.92)" };

export default function LaunchThankYouPage() {
  const [, navigate] = useLocation();
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const email = params.get("email") || "";
  const name = params.get("name") || "";
  const [countdown, setCountdown] = useState(10);

  const handleActivate = useCallback(() => {
    const p = new URLSearchParams({ email, name });
    navigate(`/launch/create-password?${p.toString()}`);
  }, [email, name, navigate]);

  useEffect(() => {
    if (countdown <= 0) {
      handleActivate();
      return;
    }
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, handleActivate]);

  return (
    <AuthBackground>
      <div className={glassCard} style={glassCardBg} data-testid="card-thank-you">
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[rgba(99,179,237,0.1)]">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#2B6CB0] to-[#2C5282]">
                  <CheckCircle className="h-7 w-7 text-white" />
                </div>
              </div>
              <div className="absolute inset-0 rounded-full border-2 border-[rgba(99,179,237,0.25)] animate-pulse" />
            </div>
          </div>
          <h2 className="text-[22px] font-bold text-white mb-2" data-testid="text-thank-you-title">
            Thank you for your interest in Tableicity!
          </h2>
        </div>

        <div className="text-center space-y-4">
          <p className="text-[#A0AEC0] text-[0.9rem]">
            You can activate your trial account right now.
          </p>
          {countdown > 0 && (
            <p className="text-[#718096] text-[0.85rem]" data-testid="text-countdown-message">
              If you prefer to wait, you will be automatically redirected in{" "}
              <span className="font-semibold text-[#63B3ED] text-lg" data-testid="text-countdown-value">{countdown}</span>{" "}
              seconds.
            </p>
          )}

          <Button
            onClick={handleActivate}
            className="w-full bg-[#2B6CB0] hover:bg-[#2C5282] text-white h-11 text-base font-semibold rounded-lg"
            data-testid="button-activate-trial"
          >
            Activate Trial
          </Button>

          <p className="text-[#718096] text-[0.75rem] pt-2">
            No credit card required. Your demo cap table is ready in under 5 minutes.
          </p>
        </div>
      </div>
    </AuthBackground>
  );
}
