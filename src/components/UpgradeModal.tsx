// WeldSizer — Upgrade Modal Component
// Shown when a free-tier user tries to access a Pro feature

import { STRIPE_CONFIG } from "~/lib/stripe";

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  featureName?: string;
}

export function UpgradeModal({ open, onClose, featureName }: UpgradeModalProps) {
  if (!open) return null;

  const handleMonthly = () => {
    window.open(STRIPE_CONFIG.monthlyUrl, "_blank", "noopener");
  };

  const handleAnnual = () => {
    window.open(STRIPE_CONFIG.annualUrl, "_blank", "noopener");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-800 shadow-2xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1 text-slate-500 transition-colors hover:bg-slate-700 hover:text-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-400"
        >
          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" />
          </svg>
        </button>

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
              Unlock the full power of WeldSizer
            </p>
          </div>

          {/* Plan Cards */}
          <div className="mb-6 grid gap-3 sm:grid-cols-2">
            {/* Monthly */}
            <div className="rounded-xl border border-slate-600 bg-slate-750 p-5 transition-colors hover:border-cyan-500/50">
              <div className="mb-1 text-xs font-medium uppercase tracking-wider text-slate-400">
                Monthly
              </div>
              <div className="mb-2">
                <span className="text-3xl font-bold text-slate-100">$9</span>
                <span className="text-sm text-slate-400">/mo</span>
              </div>
              <ul className="mb-4 space-y-1.5 text-xs text-slate-400">
                <li className="flex items-center gap-1.5">
                  <svg className="h-3.5 w-3.5 shrink-0 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                  </svg>
                  All Pro features
                </li>
                <li className="flex items-center gap-1.5">
                  <svg className="h-3.5 w-3.5 shrink-0 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                  </svg>
                  Cancel anytime
                </li>
              </ul>
              <button
                onClick={handleMonthly}
                className="w-full rounded-lg bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-800"
              >
                Subscribe $9/mo
              </button>
            </div>

            {/* Annual (highlighted) */}
            <div className="relative rounded-xl border border-amber-500/30 bg-slate-750 p-5 transition-colors hover:border-amber-400/50">
              <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-amber-500 px-3 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
                Best Value
              </div>
              <div className="mb-1 text-xs font-medium uppercase tracking-wider text-slate-400">
                Annual
              </div>
              <div className="mb-2">
                <span className="text-3xl font-bold text-slate-100">$79</span>
                <span className="text-sm text-slate-400">/yr</span>
              </div>
              <div className="mb-3 text-xs text-green-400">
                Save $29 — 2 months free
              </div>
              <ul className="mb-4 space-y-1.5 text-xs text-slate-400">
                <li className="flex items-center gap-1.5">
                  <svg className="h-3.5 w-3.5 shrink-0 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                  </svg>
                  All Pro features
                </li>
                <li className="flex items-center gap-1.5">
                  <svg className="h-3.5 w-3.5 shrink-0 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                  </svg>
                  2 months free
                </li>
              </ul>
              <button
                onClick={handleAnnual}
                className="w-full rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-slate-800"
              >
                Subscribe $79/yr
              </button>
            </div>
          </div>

          {/* Feature comparison */}
          <div className="mb-4 rounded-lg border border-slate-700 bg-slate-800/60 p-4">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
              What you get
            </h3>
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

          {/* Free tier note */}
          <p className="text-center text-xs text-slate-600">
            Free tier includes: {STRIPE_CONFIG.freeFeatures.map((f) => f.name).join(", ")}.
          </p>
        </div>
      </div>
    </div>
  );
}