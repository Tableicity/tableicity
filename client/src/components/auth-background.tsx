import type { ReactNode } from "react";
import { CheckCircle2, Zap, MousePointerClick, BarChart3, Sparkles, Building2, Rocket, Shield, Lock, KeyRound, FileCheck, ShieldCheck, Fingerprint, Mail, Clock } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { MarketingSlideshow } from "@/components/marketing-slideshow";
import capTablePreview from "@assets/Capture_Peek_Encrypted_1773816900000.png";
import pitchPhoto from "@assets/Tablicity_Page_A_1773450271778.png";

export type PitchVariant = "login" | "mfa" | "register" | "trial";

function PitchHeader() {
  return (
    <div className="flex items-center justify-between mb-5">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600">
          <Building2 className="h-4.5 w-4.5 text-white" />
        </div>
        <span className="text-lg font-bold tracking-tight">Tableicity</span>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <Zap className="h-3.5 w-3.5 text-yellow-400" />
          <span className="text-xs text-blue-200/60">Under 5 min setup</span>
        </div>
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />
          <span className="text-xs text-blue-200/60">No credit card</span>
        </div>
      </div>
    </div>
  );
}

function SecurityFooter() {
  return (
    <div className="relative z-10">
      <div className="border-t border-white/10 pt-5">
        <p className="text-blue-200/50 text-[10px] uppercase tracking-wider mb-3">Enterprise-Grade Security</p>
        <div className="space-y-2.5">
          <div className="flex items-start gap-2.5">
            <KeyRound className="h-3.5 w-3.5 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-blue-200/70"><span className="text-blue-200/90 font-medium">Authentication:</span> Multi-Factor Authentication (TOTP), httpOnly Cookies, Custom JWT with Tenant Claims</p>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <Shield className="h-3.5 w-3.5 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-blue-200/70"><span className="text-blue-200/90 font-medium">Access Control:</span> Role-Based Access Control (RBAC) with 4 tiers, Tenant Isolation Middleware</p>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <a href="https://www.tableicity.com/" className="no-underline" style={{ textDecoration: "none" }}><Lock className="h-3.5 w-3.5 text-blue-400 shrink-0 mt-0.5" /></a>
            <div>
              <p className="text-xs text-blue-200/70"><span className="text-blue-200/90 font-medium">Encryption:</span> TLS 1.3 (Transit), pgcrypto for PII (Rest), AWS Parameter Store (Secrets)</p>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <a href="https://www.tableicity.com/" className="no-underline" style={{ textDecoration: "none" }}><FileCheck className="h-3.5 w-3.5 text-blue-400 shrink-0 mt-0.5" /></a>
            <div>
              <p className="text-xs text-blue-200/70"><span className="text-blue-200/90 font-medium">Compliance:</span> Immutable Audit Logs, Webhook Signature Verification, CORS/CSRF Protection</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureBadges() {
  return (
    <div className="border-t border-white/10 pt-5">
      <p className="text-blue-200/50 text-xs uppercase tracking-wider mb-3">Everything you need — built in</p>
      <div className="grid grid-cols-3 gap-x-4 gap-y-2">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-3.5 w-3.5 text-green-400 shrink-0" />
          <span className="text-xs text-blue-200/70">Full ESOP Hierarchy</span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-3.5 w-3.5 text-green-400 shrink-0" />
          <span className="text-xs text-blue-200/70">5 Equity Instruments</span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-3.5 w-3.5 text-green-400 shrink-0" />
          <span className="text-xs text-blue-200/70">SAFE Management</span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-3.5 w-3.5 text-green-400 shrink-0" />
          <span className="text-xs text-blue-200/70">Stakeholder Tracking</span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-3.5 w-3.5 text-green-400 shrink-0" />
          <span className="text-xs text-blue-200/70">Encrypted Data Room</span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-3.5 w-3.5 text-green-400 shrink-0" />
          <span className="text-xs text-blue-200/70">Share Class Definitions</span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-3.5 w-3.5 text-green-400 shrink-0" />
          <span className="text-xs text-blue-200/70">Dashboard & Metrics</span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-3.5 w-3.5 text-green-400 shrink-0" />
          <span className="text-xs text-blue-200/70">PDF Generation - Certificates</span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-3.5 w-3.5 text-green-400 shrink-0" />
          <span className="text-xs text-blue-200/70">Email MFA Security</span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-3.5 w-3.5 text-green-400 shrink-0" />
          <span className="text-xs text-blue-200/70">Role-Based Access (4 Roles)</span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-3.5 w-3.5 text-green-400 shrink-0" />
          <span className="text-xs text-blue-200/70">Audit Logging</span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-3.5 w-3.5 text-green-400 shrink-0" />
          <span className="text-xs text-blue-200/70">Test Drive System</span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-3.5 w-3.5 text-green-400 shrink-0" />
          <span className="text-xs text-blue-200/70">Multi-Tenant Isolation</span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-3.5 w-3.5 text-green-400 shrink-0" />
          <span className="text-xs text-blue-200/70">Platform Admin Panel</span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-3.5 w-3.5 text-green-400 shrink-0" />
          <span className="text-xs text-blue-200/70">401A Validations</span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-3.5 w-3.5 text-green-400 shrink-0" />
          <span className="text-xs text-blue-200/70">Migrations</span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-3.5 w-3.5 text-green-400 shrink-0" />
          <span className="text-xs text-blue-200/70">AI Powered Simulations</span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-3.5 w-3.5 text-green-400 shrink-0" />
          <span className="text-xs text-blue-200/70">Parent - Child Apps</span>
        </div>
      </div>
    </div>
  );
}

function LoginPitchContent() {
  return (
    <>
      <p className="text-blue-200/80 text-sm leading-relaxed mb-4">
        One leaked or hacked screenshot of your Cap Table can cost millions in a lost deal or trigger a regulatory nightmare. Mitigate this risk by ensuring your equity ownership remains pseudonymous through SHA-256 Encryption with on-demand auditor reveal. Built for Founders who refuse to treat their ownership data as public property.
      </p>

      <div className="mb-5">
        <MarketingSlideshow />
      </div>

      <p className="text-blue-200/70 text-sm leading-relaxed mb-4">
        <span className="text-blue-200/90 font-medium">SHA-256 Encryption: The Industry Gold Standard.</span> Developed by the NSA, this same tech secures the Bitcoin blockchain and government-grade data, making your cap table mathematically impossible for hackers to de-anonymize.
      </p>

      <FeatureBadges />
    </>
  );
}

function MfaPitchContent() {
  return (
    <>
      <h1 className="text-2xl xl:text-3xl font-bold leading-tight mb-5">
        See your <span className="text-blue-400">cap table</span> come to life{" "}
        <span className="text-blue-400">instantly.</span>
      </h1>

      <p className="text-blue-200/80 text-base leading-relaxed mb-8">
        The fastest way for founders to get a clear, professional cap table without the hassle. Three clicks and you're inside a live, seeded cap table — no uploading messy spreadsheets, no waiting for approval, no blank slate anxiety.
      </p>

      <div className="flex gap-8 mb-8 items-center">
        <div className="shrink space-y-4" style={{ flex: "0 1 55%" }}>
          <div className="flex items-start gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-500/20 shrink-0 mt-0.5">
              <MousePointerClick className="h-3.5 w-3.5 text-blue-400" />
            </div>
            <div>
              <p className="font-semibold text-sm">3-Click Onboarding</p>
              <p className="text-blue-200/60 text-sm mt-0.5">Click three times and you're inside a live, seeded cap table with founders, employees, investors, and vesting schedules.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-500/20 shrink-0 mt-0.5">
              <BarChart3 className="h-3.5 w-3.5 text-blue-400" />
            </div>
            <div>
              <p className="font-semibold text-sm">True Test Drive</p>
              <p className="text-blue-200/60 text-sm mt-0.5">Model funding rounds, add option pools, simulate exits, and check off features via our guided checklist — all in minutes.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-500/20 shrink-0 mt-0.5">
              <Sparkles className="h-3.5 w-3.5 text-blue-400" />
            </div>
            <div>
              <p className="font-semibold text-sm">Founder-First Design</p>
              <p className="text-blue-200/60 text-sm mt-0.5">Built for speed and clarity, with context-aware explanations right when you need them. No boring chatbots.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-500/20 shrink-0 mt-0.5">
              <Rocket className="h-3.5 w-3.5 text-blue-400" />
            </div>
            <div>
              <p className="font-semibold text-sm">Your Cap Table, When You're Ready</p>
              <p className="text-blue-200/60 text-sm mt-0.5">Once you've explored the sandbox, create your own organization — a fresh, private cap table for your company, completely isolated and yours.</p>
            </div>
          </div>
        </div>

        <div className="hidden xl:flex items-center" style={{ flex: "0 1 45%" }}>
          <div className="relative w-full">
            <div className="overflow-hidden rounded-tl-[2rem] rounded-tr-xl rounded-bl-xl rounded-br-xl">
              <img
                src={pitchPhoto}
                alt="Professional using Tableicity platform"
                className="w-full h-auto object-cover"
                data-testid="img-pitch-photo"
              />
            </div>
          </div>
        </div>
      </div>

      <FeatureBadges />
    </>
  );
}

function PitchPanel({ variant = "login" }: { variant?: PitchVariant }) {
  return (
    <div className="hidden lg:flex lg:w-[45%] bg-[#0f1b2d] text-white flex-col justify-between p-10 xl:p-12 relative overflow-hidden" data-testid="card-pitch">
      <div className="relative z-10 flex-1 flex flex-col">
        <PitchHeader />
        {variant === "mfa" && <MfaPitchContent />}
        {variant === "login" && <LoginPitchContent />}
        {variant === "register" && <MfaPitchContent />}
        {variant === "trial" && <MfaPitchContent />}
      </div>
      <SecurityFooter />
    </div>
  );
}

export function AuthBackground({ children, variant = "login" }: { children: ReactNode; variant?: PitchVariant }) {
  return (
    <div className="relative min-h-screen flex" data-testid="auth-layout">
      <PitchPanel variant={variant} />

      <div className="flex-1 relative bg-[#0a1628]">
        <div
          className="absolute inset-0 bg-cover bg-no-repeat opacity-[0.25] pointer-events-none"
          style={{ backgroundImage: `url(${capTablePreview})`, backgroundPosition: "0% center" }}
        />

        <div className="absolute top-6 right-6 z-20">
          <ThemeToggle />
        </div>

        <div className="lg:hidden absolute top-6 left-6 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-600">
            <Building2 className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-bold text-white">Tableicity</span>
        </div>

        <div className="absolute inset-0 overflow-y-auto flex items-center justify-center p-6">
          <div className="w-full max-w-md flex items-center justify-center relative z-10 my-auto">
            {children}
          </div>
        </div>
      </div>

    </div>
  );
}
