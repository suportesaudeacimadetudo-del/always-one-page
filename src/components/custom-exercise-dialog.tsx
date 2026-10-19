import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { exerciseCategories, regions, type Exercise } from "@/data/exercises";
import { prepareExerciseImage, validateCustomExercise } from "@/lib/custom-exercises";

const fieldClass =
  "mt-1 w-full rounded-lg border border-border bg-white p-3 text-sm outline-none focus:border-green focus:ring-2 focus:ring-green/20";

export function CustomExerciseDialog({
  initial,
  onClose,
  onSave,
}: {
  initial: Exercise | null;
  onClose: () => void;
  onSave: (exercise: Exercise) => Promise<void>;
}) {
  const [image, setImage] = useState(initial?.image ?? "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [preparing, setPreparing] = useState(false);
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !busy && !preparing) onClose();
      }}
    >
      <DialogContent className="max-h-[90dvh] w-[calc(100%-24px)] max-w-2xl overflow-y-auto rounded-2xl bg-white">
        <DialogHeader>
          <DialogTitle className="text-xl text-primary">
            {initial ? "Editar exercício" : "Novo exercício"}
          </DialogTitle>
          <DialogDescription>
            Salvo neste navegador. Use o backup para levar seus exercícios para outro aparelho.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={async (event) => {
            event.preventDefault();
            setError("");
            const form = new FormData(event.currentTarget);
            try {
              const exercise = validateCustomExercise({
                id: initial?.id ?? `user-${crypto.randomUUID()}`,
                name: form.get("name"),
                region: form.get("region"),
                category: form.get("category"),
                objective: form.get("category"),
                summary: form.get("summary"),
                instructions: String(form.get("instructions") ?? "")
                  .split("\n")
                  .map((x) => x.trim())
                  .filter(Boolean),
                equipment: form.get("equipment"),
                notes: form.get("notes"),
                ...(image ? { image } : {}),
              });
              setBusy(true);
              await onSave(exercise);
              onClose();
            } catch (err) {
              setError(
                err instanceof Error
                  ? err.message
                  : "Não foi possível salvar. Verifique o espaço disponível no navegador.",
              );
            } finally {
              setBusy(false);
            }
          }}
        >
          <label className="block text-sm font-semibold">
            Nome do exercício *
            <input
              autoFocus
              name="name"
              required
              maxLength={150}
              defaultValue={initial?.name}
              className={fieldClass}
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-semibold">
              Região *
              <select
                name="region"
                defaultValue={initial?.region ?? "Outro"}
                className={fieldClass}
              >
                {[...new Set([...regions, ...(initial ? [initial.region] : [])])].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
            <label className="text-sm font-semibold">
              Objetivo *
              <select
                name="category"
                defaultValue={initial?.category ?? "Mobilidade"}
                className={fieldClass}
              >
                {[...new Set([...exerciseCategories, ...(initial ? [initial.category] : [])])].map(
                  (x) => (
                    <option key={x}>{x}</option>
                  ),
                )}
              </select>
            </label>
          </div>
          <label className="block text-sm font-semibold">
            Descrição breve
            <input
              name="summary"
              maxLength={500}
              defaultValue={initial?.summary}
              className={fieldClass}
            />
          </label>
          <label className="block text-sm font-semibold">
            Como executar *
            <textarea
              name="instructions"
              required
              rows={4}
              maxLength={6000}
              defaultValue={initial?.instructions.join("\n")}
              placeholder="Uma instrução por linha. Escreva no idioma que deseja usar no PDF."
              className={fieldClass}
            />
          </label>
          <label className="block text-sm font-semibold">
            Equipamento
            <input
              name="equipment"
              maxLength={200}
              defaultValue={initial?.equipment}
              className={fieldClass}
            />
          </label>
          <label className="block text-sm font-semibold">
            Orientação adicional
            <textarea
              name="notes"
              rows={2}
              maxLength={1500}
              defaultValue={initial?.notes}
              className={fieldClass}
            />
          </label>
          <div className="rounded-xl border border-dashed border-border p-4">
            <label className="block text-sm font-semibold">
              Imagem opcional
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                disabled={preparing || busy}
                className="mt-2 block w-full text-xs"
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  setPreparing(true);
                  setError("");
                  try {
                    setImage(await prepareExerciseImage(file));
                  } catch (err) {
                    setError(err instanceof Error ? err.message : "Imagem inválida.");
                  } finally {
                    setPreparing(false);
                    event.target.value = "";
                  }
                }}
              />
            </label>
            <p className="mt-2 text-xs text-slate-500">
              JPEG, PNG ou WebP • até 5 MB • utilize uma imagem que você tenha autorização para
              usar.
            </p>
            {preparing && <p role="status">Preparando imagem…</p>}
            {image && (
              <div className="mt-3 flex items-center gap-4">
                <img
                  src={image}
                  alt="Prévia da imagem do exercício"
                  className="size-20 rounded-lg object-contain"
                />
                <button type="button" onClick={() => setImage("")} className="text-sm text-red-700">
                  Remover imagem
                </button>
              </div>
            )}
          </div>
          {error && (
            <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-3 border-t border-border pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={busy || preparing}
              className="rounded-lg border border-border px-4 py-3 text-sm font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={busy || preparing}
              className="rounded-lg bg-primary px-4 py-3 text-sm font-bold text-white disabled:opacity-50"
            >
              {busy ? "Salvando…" : "Salvar exercício"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
