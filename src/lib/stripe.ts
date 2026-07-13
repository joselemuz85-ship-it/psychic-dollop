// WeldSizer — Stripe Checkout Configuration
// One-time access products (30-day / 365-day) — no auto-renewing subscriptions

export const STRIPE_CONFIG = {
  // 30-day access ($9)
  monthlyUrl: "https://buy.stripe.com/8x24gzdVB0f751i5NdbfO00",

  // 365-day access ($79)
  annualUrl: "https://buy.stripe.com/8x2dR93gX5zrgK00sTbfO01",

  // Business contact for manual activation requests
  businessEmail: "weldsizer-210eaa29@ctomail.io",
  activationTurnaround: "24 hours",

  // Feature labels for the upgrade modal
  proFeatures: [
    { name: "Alloy-Specific Grades", description: "316L, 5083-H116, and more with yield strength data" },
    { name: "Custom Code Standards", description: "Add your own code reference notes" },
    { name: "Calculation History", description: "Save and review past calculations with localStorage" },
    { name: "PDF Report Export", description: "Professional printable weld calculation reports" },
    { name: "Yield Strength Data", description: "Material-specific strength reference" },
  ],

  freeFeatures: [
    { name: "5 Joint Types", description: "Fillet, Butt, Groove, Socket, Lap" },
    { name: "3 Material Types", description: "Carbon Steel, Stainless Steel, Aluminum" },
    { name: "3 Code Standards", description: "AWS D1.1, ASME B31.3, General Practice" },
    { name: "Unit Toggle", description: "Inches and millimeters" },
    { name: "Copy Results", description: "One-click copy to clipboard" },
  ],
};

// Check if user is Pro (persisted in localStorage)
const PRO_STORAGE_KEY = "weldsizer-pro-status";

export function isProUser(): boolean {
  try {
    return localStorage.getItem(PRO_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

export function setProStatus(pro: boolean): void {
  try {
    if (pro) {
      localStorage.setItem(PRO_STORAGE_KEY, "true");
    } else {
      localStorage.removeItem(PRO_STORAGE_KEY);
    }
  } catch {
    // Silently fail
  }
}

// For development/preview: allow bypassing the paywall
export function isProPreview(): boolean {
  try {
    return localStorage.getItem("weldsizer-pro-preview") === "true";
  } catch {
    return false;
  }
}

export function setProPreview(enabled: boolean): void {
  try {
    if (enabled) {
      localStorage.setItem("weldsizer-pro-preview", "true");
    } else {
      localStorage.removeItem("weldsizer-pro-preview");
    }
  } catch {
    // Silently fail
  }
}

// Upgrade click tracking — simple counter for iteration
const TRACKING_KEY = "weldsizer-upgrade-clicks";

export function trackUpgradeClick(location: string, plan: string): void {
  try {
    const existing = localStorage.getItem(TRACKING_KEY);
    const clicks = existing ? JSON.parse(existing) : [];
    clicks.push({
      location,
      plan,
      timestamp: Date.now(),
      userAgent: navigator.userAgent.substring(0, 80),
    });
    // Keep last 50 events
    if (clicks.length > 50) clicks.splice(0, clicks.length - 50);
    localStorage.setItem(TRACKING_KEY, JSON.stringify(clicks));
  } catch {
    // Silently fail
  }
}

export function getUpgradeClicks(): Array<{ location: string; plan: string; timestamp: number }> {
  try {
    const raw = localStorage.getItem(TRACKING_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}