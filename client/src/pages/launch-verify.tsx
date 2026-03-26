import { useEffect, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthBackground } from "@/components/auth-background";

const glassCard = "w-full max-w-[420px] rounded-2xl p-8 border border-[rgba(99,179,237,0.2)] shadow-[0_25px_60px_rgba(0,0,0,0.5),0_0_0_1px_rgba(99,179,237,0.08)] backdrop-blur-[20px]";
const glassCardBg = { background: "rgba(13, 20, 35, 0.92)" };

export default function LaunchVerifyPage() {
  const [, navigate] = useLocation();
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const token = params.get("token") || "";

  const [status, setStatus] = useState<"loading" | "success" | "logging-in" | "error">("loading");
  const [email, setEmail] = useState("");
  const [orgToken, setOrgToken] = useState("");
  const [sandboxSlug, setSandboxSlug] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErrorMessage("No verification token found.");
      return;
    }

    fetch(`/api/trial-verify?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        const data = await res.json();
        if (res.ok) {
          setEmail(data.email || "");
          setOrgToken(data.orgToken || "");
          setSandboxSlug(data.sandboxSlug || "");

          if (data.orgToken && data.sandboxSlug) {
            setStatus("logging-in");
            try {
              const loginRes = await fetch("/api/trial-auto-login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ orgToken: data.orgToken }),
              });
              if (loginRes.ok) {
                localStorage.setItem("tableicty_tenant", data.sandboxSlug);
                window.location.href = "/";
                return;
              }
            } catch {
            }
          }
          setStatus("success");
        } else {
          setStatus("error");
          setErrorMessage(data.message || "Verification failed.");
        }
      })
      .catch(() => {
        setStatus("error");
        setErrorMessage("Something went wrong. Please try again.");
      });
  }, [token]);

  if (status === "loading" || status === "logging-in") {
    return (
      <AuthBackground>
        <div className={glassCard} style={glassCardBg} data-testid="card-verify-loading">
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-[#63B3ED] mb-4" />
            <p className="text-[#A0AEC0] text-[0.9rem]" data-testid="text-verify-status">
              {status === "logging-in" ? "Setting up your workspace..." : "Verifying your email..."}
            </p>
          </div>
        </div>
      </AuthBackground>
    );
  }

  if (status === "error") {
    return (
      <AuthBackground>
        <div className={glassCard} style={glassCardBg} data-testid="card-verify-error">
          <div className="text-center mb-6">
            <div className="flex justify-center mb-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[rgba(245,101,101,0.12)] border border-[rgba(245,101,101,0.25)]">
                <XCircle className="h-8 w-8 text-red-400" />
              </div>
            </div>
            <h2 className="text-[22px] font-bold text-white mb-2">Verification Failed</h2>
          </div>
          <div className="text-center space-y-4">
            <p className="text-[#A0AEC0] text-[0.9rem]">{errorMessage}</p>
            <Button
              variant="outline"
              className="w-full border-[rgba(99,179,237,0.25)] text-[#A0AEC0] hover:bg-[rgba(99,179,237,0.08)] hover:text-white bg-transparent rounded-lg h-11"
              onClick={() => navigate("/login")}
              data-testid="button-go-to-signin"
            >
              Go to Sign In
            </Button>
          </div>
        </div>
      </AuthBackground>
    );
  }

  return (
    <AuthBackground>
      <div className={glassCard} style={glassCardBg} data-testid="card-verify-success">
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[rgba(72,187,120,0.12)] border border-[rgba(72,187,120,0.25)]">
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
          </div>
          <h2 className="text-[22px] font-bold text-white mb-2" data-testid="text-verified-title">Email Verified!</h2>
        </div>
        <div className="text-center space-y-4">
          <p className="text-[#A0AEC0] text-[0.9rem]">
            Your email has been verified. Click below to explore the platform.
          </p>
          <Button
            className="w-full bg-[#2B6CB0] hover:bg-[#2C5282] text-white h-11 font-semibold rounded-lg"
            onClick={() => navigate("/login")}
            data-testid="button-go-to-login"
          >
            Go to Sign In
          </Button>
        </div>
      </div>
    </AuthBackground>
  );
}
