// WeldSizer — Upgrade Modal Component
// One-time access products (30-day / 365-day) — no auto-renewing subscriptions

import { useState } from "react";
import { STRIPE_CONFIG, trackUpgradeClick } from "~/lib/stripe";

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  featureName?: string;
}

type ModalView = "plans" | "activation";

export function UpgradeModal({ open, onClose, featureName }: UpgradeModalProps) {
  const [view, setView] = useState<ModalView>("plans");
  const [activationEmail, setActivationEmail] = useState("");
  const [activationPlan, setActivationPlan] = useState("30-day");
  const [activationNote, setActivationNote] = useState("");

  if (!open) return null;

  const handleMonthly = () => {
    trackUpgradeClick("upgrade-modal", "30-day");
    window.open(STRIPE_CONFIG.monthlyUrl, "_blank", "noopener");
  };

  const handleAnnual = () => {
    trackUpgradeClick("upgrade-modal", "365-day");
    window.open(STRIPE_CONFIG.annualUrl, "_blank", "noopener");
  };

  const buildMailTo = (): string => {
    const subject = encodeURIComponent("WeldSizer Pro Activation Request");
    const body = encodeURIComponent(
      `Pro Activation Request\n\n` +
      `Email: ${activationEmail || "[your email here]"}\n` +
      `Plan: ${activationPlan}\n` +
      `Note: ${activationNote || "(none)"}\n\n` +
      `I purchased a WeldSizer Pro plan and would like my account activated.\n` +
      `Please confirm receipt and activate Pro access.`
    );
    return `mailto:${STRIPE_CONFIG.businessEmail}?subject=${subject}&body=${body}`;
  };

  const resetForm = () => {
    setActivationEmail("");
    setActivationPlan("30-day");
    setActivationNote("");
    setView("plans");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-800 shadow-2xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-full p-1 text-slate-500 transition-colors hover:bg-slate-700 hover:text-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-400"
        >
          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" />
          </svg>
        </button>

        {view === "plans" ? (
          /* ========== PLAN SELECTION VIEW ========== */
          <div className="p-6 sm:p-8">
            {/* Header */}
            <div className="mb-6 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/15">
                <svg className="h-6 w-6 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-slate-100">Upgrade to Pro</h2>
              {featureName && (
                <p className="mt-2 text-sm text-amber-400">
                  "{featureName}" is a Pro feature
                </p>
              )}
              <p className="mt-1 text-sm text-slate-400">
                Unlock the full power of WeldSizer with a one-time access purchase
              </p>
            </div>

            {/* Plan Cards */}
            <div className="mb-6 grid gap-3 sm:grid-cols-2">
              {/* 30-day access */}
              <div className="rounded-xl border border-slate-600 bg-slate-750/40 p-5 transition-colors hover:border-cyan-500/50 hover:bg-slate-750/60">
                <div className="mb-1 text-xs font-medium uppercase tracking-wider text-slate-400">30-Day Access</div>
                <div className="mb-2">
                  <span className="text-3xl font-bold text-slate-100">$9</span>
                  <span className="text-sm text-slate-400"> one-time</span>
                </div>
                <ul className="mb-4 space-y-1.5 text-xs text-slate-400">
                  <li className="flex items-center gap-1.5">
                    <svg className="h-3.5 w-3.5 shrink-0 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                    </svg>
                    All Pro features unlocked
                  </li>
                  <li className="flex items-center gap-1.5">
                    <svg className="h-3.5 w-3.5 shrink-0 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                    </svg>
                    No recurring charges
                  </li>
                </ul>
                <button onClick={handleMonthly} className="w-full rounded-lg bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-800">
                  Get Pro — $9
                </button>
              </div>

              {/* 365-day access */}
              <div className="relative rounded-xl border border-amber-500/30 bg-slate-750/40 p-5 transition-colors hover:border-amber-400/50 hover:bg-slate-750/60">
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-amber-500 px-3 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">Best Value</div>
                <div className="mb-1 text-xs font-medium uppercase tracking-wider text-slate-400">365-Day Access</div>
                <div className="mb-2">
                  <span className="text-3xl font-bold text-slate-100">$79</span>
                  <span className="text-sm text-slate-400"> one-time</span>
                </div>
                <div className="mb-3 text-xs font-medium text-green-400">Save $29 vs. 30-day renewals</div>
                <ul className="mb-4 space-y-1.5 text-xs text-slate-400">
                  <li className="flex items-center gap-1.5">
                    <svg className="h-3.5 w-3.5 shrink-0 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                    </svg>
                    All Pro features unlocked
                  </li>
                  <li className="flex items-center gap-1.5">
                    <svg className="h-3.5 w-3.5 shrink-0 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                    </svg>
                    Full year of access
                  </li>
                </ul>
                <button onClick={handleAnnual} className="w-full rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-slate-800">
                  Get Pro — $79
                </button>
              </div>
            </div>

            {/* Feature comparison */}
            <div className="mb-4 rounded-lg border border-slate-700 bg-slate-800/60 p-4">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">What you get with Pro</h3>
              <div className="grid gap-x-4 gap-y-2 sm:grid-cols-2">
                {STRIPE_CONFIG.proFeatures.map((f) => (
                  <div key={f.name} className="flex items-start gap-2">
                    <svg className="mt-0.5 h-4 w-4 shrink-0 text-cyan-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                    </svg>
                    <div>
                      <div className="text-sm font-medium text-slate-200">{f.name}</div>
                      <div className="text-xs text-slate-500">{f.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* One-time purchase note */}
            <p className="mb-2 text-center text-xs text-slate-600">
              One-time purchase. No recurring charges. Access expires after the selected period.
            </p>

            {/* Activation note + link */}
            <div className="border-t border-slate-700 pt-4 text-center">
              <p className="mb-2 text-xs text-slate-500">
                Already purchased? Activation is manual — we'll enable Pro within {STRIPE_CONFIG.activationTurnaround} of your request.
              </p>
              <button
                onClick={() => setView("activation")}
                className="text-xs font-medium text-cyan-400 underline transition-colors hover:text-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 rounded px-2 py-1"
              >
                I already purchased — activate my account →
              </button>
            </div>
          </div>
        ) : (
          /* ========== ACTIVATION VIEW ========== */
          <div className="p-6 sm:p-8">
            {/* Back link */}
            <button
              onClick={resetForm}
              className="mb-4 flex items-center gap-1 text-xs text-slate-500 transition-colors hover:text-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 rounded px-1 py-0.5"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" />
              </svg>
              Back to plans
            </button>

            <div className="mb-6 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-cyan-500/15">
                <svg className="h-6 w-6 text-cyan-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-slate-100">Activate Your Pro Access</h2>
              <p className="mt-1 text-sm text-slate-400">
                Complete this form, then send the email to request manual activation.
              </p>
            </div>

            {/* Activation Form */}
            <div className="mb-4 space-y-4">
              {/* Email */}
              <div>
                <label htmlFor="activation-email" className="label-text">Your Email</label>
                <input
                  id="activation-email"
                  type="email"
                  value={activationEmail}
                  onChange={(e) => setActivationEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="input-field"
                />
              </div>

              {/* Plan */}
              <div>
                <label htmlFor="activation-plan" className="label-text">Plan Purchased</label>
                <select
                  id="activation-plan"
                  value={activationPlan}
                  onChange={(e) => setActivationPlan(e.target.value)}
                  className="select-field"
                >
                  <option value="30-day">30-Day Access ($9)</option>
                  <option value="365-day">365-Day Access ($79)</option>
                </select>
              </div>

              {/* Optional note */}
              <div>
                <label htmlFor="activation-note" className="label-text">Order Reference (optional)</label>
                <input
                  id="activation-note"
                  type="text"
                  value={activationNote}
                  onChange={(e) => setActivationNote(e.target.value)}
                  placeholder="e.g. Stripe receipt email or order ID"
                  className="input-field"
                />
              </div>

              {/* Activation notice */}
              <div className="rounded-lg border border-slate-600 bg-slate-800/60 p-3 text-xs text-slate-400 leading-relaxed">
                <p className="mb-1 font-medium text-slate-300">How activation works:</p>
                <ul className="list-inside list-disc space-y-0.5">
                  <li>After purchasing, send the activation request via email</li>
                  <li>We'll enable Pro access within <strong className="text-slate-200">{STRIPE_CONFIG.activationTurnaround}</strong></li>
                  <li>You'll receive a confirmation once your account is activated</li>
                  <li>Access expires after your purchased period ends</li>
                </ul>
              </div>
            </div>

            {/* Send button (mailto:) */}
            <a
              href={buildMailTo()}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-cyan-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-800"
            >
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
              </svg>
              Send Activation Request
            </a>
            <p className="mt-2 text-center text-xs text-slate-500">
              Opens your email client with a prefilled message to {STRIPE_CONFIG.businessEmail}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}