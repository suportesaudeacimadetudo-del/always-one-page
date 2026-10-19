import { Check } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { plusPlans, formatPrice, annualSavingsCents, annualSavingsPercent } from "@/data/plans";

export function PlansDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const available =
    plusPlans.checkoutVerified && !!plusPlans.monthlyCheckoutUrl && !!plusPlans.annualCheckoutUrl;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] w-[calc(100%-24px)] max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 md:p-8">
        <div>
          <p className="eyebrow mb-3">Fisio Express Plus</p>
          <DialogTitle className="pr-6 text-2xl font-bold leading-tight text-primary">
            Mais praticidade para suas orientações
          </DialogTitle>
          <DialogDescription className="mt-3 text-sm leading-relaxed">
            Escolha como prefere pagar pelo Plus. Os dois planos oferecem os mesmos recursos.
          </DialogDescription>
        </div>
        <ul className="space-y-2 text-sm text-slate-600">
          {[
            "Fichas completas em PDF com ilustrações",
            "Personalização de exercícios e orientações",
            "Cadastro de exercícios próprios com imagem",
          ].map((text) => (
            <li key={text} className="flex items-start gap-2">
              <Check className="mt-0.5 size-4 shrink-0 text-green" />
              {text}
            </li>
          ))}
        </ul>
        <div className="grid gap-4 sm:grid-cols-2">
          <PlanCard
            name="Mensal"
            price={plusPlans.monthlyCents}
            period="/mês"
            detail="Cobrança mensal."
            checkoutUrl={plusPlans.monthlyCheckoutUrl}
          />
          <PlanCard
            name="Anual"
            price={plusPlans.annualCents}
            period="/ano"
            detail="Uma cobrança de R$ 147 por 12 meses."
            checkoutUrl={plusPlans.annualCheckoutUrl}
            annual
          />
        </div>
        {!available && (
          <p className="rounded-xl bg-slate-50 p-3 text-center text-xs leading-relaxed text-slate-500">
            As assinaturas estarão disponíveis em breve. Enquanto isso, você pode continuar
            experimentando o aplicativo gratuitamente.
          </p>
        )}
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="mx-auto text-sm font-semibold text-primary underline underline-offset-4"
        >
          Continuar no Plano Free
        </button>
      </DialogContent>
    </Dialog>
  );
}

function PlanCard({
  name,
  price,
  period,
  detail,
  checkoutUrl,
  annual = false,
}: {
  name: string;
  price: number;
  period: string;
  detail: string;
  checkoutUrl: string | null;
  annual?: boolean;
}) {
  const safeUrl =
    plusPlans.checkoutVerified && checkoutUrl?.startsWith("https://") ? checkoutUrl : null;
  return (
    <section
      className={`flex flex-col rounded-2xl border p-5 ${annual ? "border-green bg-mint" : "border-border bg-white"}`}
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-bold text-primary">{name}</h3>
        {annual && (
          <span className="rounded-full bg-green px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
            Melhor valor
          </span>
        )}
      </div>
      <p className="mt-4 text-3xl font-bold tracking-tight text-primary">
        {formatPrice(price)}
        <span className="ml-1 text-sm font-medium tracking-normal text-slate-500">{period}</span>
      </p>
      {annual && (
        <p className="mt-2 text-[11px] leading-relaxed text-green">
          (economize {formatPrice(annualSavingsCents)}/ano · {annualSavingsPercent}%)
        </p>
      )}
      <p className="mb-5 mt-3 text-xs leading-relaxed text-slate-500">{detail}</p>
      {safeUrl ? (
        <a
          href={safeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-auto rounded-lg bg-primary px-4 py-3 text-center text-sm font-bold text-white"
        >
          Assinar {name.toLowerCase()}
        </a>
      ) : (
        <button
          type="button"
          disabled
          className="mt-auto rounded-lg bg-primary/10 px-4 py-3 text-sm font-semibold text-primary/60"
          aria-label={`Plano ${name.toLowerCase()} disponível em breve`}
        >
          Em breve
        </button>
      )}
    </section>
  );
}
