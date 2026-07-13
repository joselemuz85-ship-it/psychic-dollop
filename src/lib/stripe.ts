// WeldSizer — Stripe Checkout Configuration
// Set these to your live Stripe payment links from the Stripe Dashboard

export const STRIPE_CONFIG = {
  // Monthly subscription ($9/mo)
  monthlyUrl: "https://buy.stripe.com/9AQ___replace_with_your_monthly_link___", // TODO: replace with live Stripe link

  // Annual subscription ($79/yr)
  annualUrl: "https://buy.stripe.com/3cs___replace_with_your_annual_link___", // TODO: replace with live Stripe link

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