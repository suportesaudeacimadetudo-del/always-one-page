// Fill only with the checkout URLs for these exact BRL subscription products.
// A successful checkout must be verified on the server before granting access.
export const plusPlans = {
  monthlyCents: 1990,
  annualCents: 14700,
  monthlyCheckoutUrl: "https://go.centerpag.com/PPU38CQH3TQ" as string | null,
  annualCheckoutUrl: "https://go.centerpag.com/PPU38CQH3TQ" as string | null,
  // Currently this checkout shows a different product for USD 5.00.
  // Enable only after verifying both BRL billing periods and the product.
  checkoutVerified: false,
};

export const formatPrice = (cents: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);

export const annualSavingsCents = plusPlans.monthlyCents * 12 - plusPlans.annualCents;
export const annualSavingsPercent = new Intl.NumberFormat("pt-BR", {
  maximumFractionDigits: 1,
}).format((annualSavingsCents / (plusPlans.monthlyCents * 12)) * 100);
