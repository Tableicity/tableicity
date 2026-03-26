import { useSearch } from "wouter";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthBackground } from "@/components/auth-background";

const glassCard = "w-full max-w-[420px] rounded-2xl p-8 border border-[rgba(99,179,237,0.2)] shadow-[0_25px_60px_rgba(0,0,0,0.5),0_0_0_1px_rgba(99,179,237,0.08)] backdrop-blur-[20px]";
const glassCardBg = { background: "rgba(13, 20, 35, 0.92)" };

export default function LaunchCheckEmailPage() {
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const email = params.get("email") || "your email";

  return (
    <AuthBackground>
      <div className={glassCard} style={glassCardBg} data-testid="card-check-email">
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[rgba(99,179,237,0.12)] border border-[rgba(99,179,237,0.25)]">
              <Mail className="h-8 w-8 text-[#63B3ED]" />
            </div>
          </div>
          <h2 className="text-[22px] font-bold text-white mb-2" data-testid="text-check-email-title">Check Your Email</h2>
        </div>

        <div className="text-center space-y-4">
          <p className="text-[#A0AEC0] text-[0.9rem]">
            We have sent a verification link to <span className="font-semibold text-[#63B3ED]">{email}</span>.
          </p>
          <p className="text-[#718096] text-[0.85rem]">
            Click the link in the email to verify your account and continue setting up your organization.
          </p>

          <div className="pt-4">
            <Button
              variant="outline"
              className="w-full border-[rgba(99,179,237,0.25)] text-[#A0AEC0] hover:bg-[rgba(99,179,237,0.08)] hover:text-white bg-transparent rounded-lg h-11"
              onClick={() => window.location.href = "/login"}
              data-testid="button-go-to-signin"
            >
              Go Back to Sign In
            </Button>
          </div>
        </div>
      </div>
    </AuthBackground>
  );
}
