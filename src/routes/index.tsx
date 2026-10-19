import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Download,
  ExternalLink,
  FileText,
  Info,
  Menu,
  MessageCircle,
  Plus,
  Search,
  Share2,
  ShieldCheck,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { CustomExerciseDialog } from "@/components/custom-exercise-dialog";
import { PlansDialog } from "@/components/plans-dialog";
import {
  MAX_BACKUP_BYTES,
  parseBackup,
  readCustomExercises,
  writeCustomExercises,
} from "@/lib/custom-exercises";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ExerciseIllustration } from "@/components/exercise-illustration";
import {
  regions,
  freePreviewExercises,
  exercises as baseExercises,
  matchesExercise,
  type Exercise,
} from "@/data/exercises";
import { createExercisePdf, downloadBlob, type PrescriptionItem } from "@/lib/exercise-pdf";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Fisio Express | Prescrições em poucos cliques" },
      {
        name: "description",
        content:
          "Encontre, personalize e envie orientações de exercícios para seus pacientes em poucos cliques.",
      },
      { property: "og:title", content: "Fisio Express" },
      {
        property: "og:description",
        content: "Uma biblioteca inteligente de exercícios para fisioterapeutas.",
      },
    ],
  }),
  component: Index,
});

type Stage = "library" | "customize" | "preview";
type PrescriptionFields = Omit<PrescriptionItem, "exercise">;

const emptyFields: PrescriptionFields = {
  series: "",
  repetitions: "",
  duration: "",
  frequency: "",
  observation: "",
};

export function Index() {
  const [plansOpen, setPlansOpen] = useState(false);
  const [stage, setStage] = useState<Stage>("library");
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("Cervical");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [prescriptions, setPrescriptions] = useState<Record<string, PrescriptionFields>>({});
  const [professional, setProfessional] = useState("");
  const [patient, setPatient] = useState("");
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [pdfUrl, setPdfUrl] = useState("");
  const [fileName, setFileName] = useState("orientacoes-exercicios.pdf");
  const [isGenerating, setIsGenerating] = useState(false);
  const [notice, setNotice] = useState("");
  const [mobileMenu, setMobileMenu] = useState(false);
  const libraryRef = useRef<HTMLElement>(null);
  const [customExercises, setCustomExercises] = useState<Exercise[]>([]);
  const [customOnly, setCustomOnly] = useState(false);
  const [editor, setEditor] = useState<Exercise | null | undefined>(undefined);
  const [deleting, setDeleting] = useState<Exercise | null>(null);
  const [storageReady, setStorageReady] = useState(false);
  const [storageError, setStorageError] = useState("");
  const [storageBusy, setStorageBusy] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);
  const exercises = useMemo(() => [...baseExercises, ...customExercises], [customExercises]);
  useEffect(() => {
    let active = true;
    readCustomExercises()
      .then((items) => {
        if (active) {
          setCustomExercises(items);
          setStorageReady(true);
        }
      })
      .catch(() => {
        if (active)
          setStorageError(
            "O armazenamento deste navegador está indisponível. Seus exercícios existentes não foram alterados. Verifique as permissões do navegador e recarregue a página.",
          );
      });
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 6000);
    return () => window.clearTimeout(timer);
  }, [notice]);
  const saveExercise = async (exercise: Exercise) => {
    try {
      await writeCustomExercises([exercise]);
    } catch {
      throw new Error(
        "Não foi possível salvar no navegador. Verifique o espaço disponível e tente novamente.",
      );
    }
    setCustomExercises((items) => [...items.filter((item) => item.id !== exercise.id), exercise]);
    setCustomOnly(true);
    setSearch("");
    setActiveCategory("");
    setNotice("Exercício salvo. Você já pode adicioná-lo à ficha.");
  };
  const exportExercises = () => {
    downloadBlob(
      new Blob(
        [
          JSON.stringify(
            {
              format: "fisio-express-exercises",
              version: 1,
              exportedAt: new Date().toISOString(),
              exercises: customExercises,
            },
            null,
            2,
          ),
        ],
        { type: "application/json" },
      ),
      "fisio-express-meus-exercicios.json",
    );
  };
  const importExercises = async (file: File) => {
    setStorageBusy(true);
    try {
      if (file.size > MAX_BACKUP_BYTES) throw new Error("O backup deve ter até 25 MB.");
      const incoming = parseBackup(await file.text());
      // Preserve current records, including edits made after an earlier backup.
      const ids = new Set(customExercises.map((item) => item.id));
      const additions = incoming.filter((item) => !ids.has(item.id));
      await writeCustomExercises(additions);
      setCustomExercises((items) => [...items, ...additions]);
      setCustomOnly(true);
      setSearch("");
      setActiveCategory("");
      setNotice(
        `${additions.length} exercício(s) importado(s). Itens já existentes foram preservados.`,
      );
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Não foi possível importar o backup.");
    } finally {
      setStorageBusy(false);
    }
  };

  const selectedExercises = useMemo(
    () =>
      selectedIds.map((id) => exercises.find((exercise) => exercise.id === id)!).filter(Boolean),
    [selectedIds, exercises],
  );

  const visibleExercises = useMemo(
    () =>
      (customOnly ? customExercises : freePreviewExercises).filter(
        (exercise) =>
          (!activeCategory || exercise.region === activeCategory) &&
          matchesExercise(exercise, search),
      ),
    [activeCategory, search, customOnly, customExercises],
  );
  const regionFilters = customOnly
    ? [...new Set(customExercises.map((exercise) => exercise.region))]
    : regions.filter((region) => region !== "Outro");

  useEffect(() => {
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, [pdfUrl]);

  const addExercise = (exercise: Exercise) => {
    setSelectedIds((current) =>
      current.includes(exercise.id) ? current : [...current, exercise.id],
    );
    setPrescriptions((current) => ({
      ...current,
      [exercise.id]: current[exercise.id] ?? { ...emptyFields },
    }));
    setNotice(`${exercise.name} adicionado à ficha.`);
  };

  const removeExercise = (id: string) => {
    setSelectedIds((current) => current.filter((item) => item !== id));
  };

  const moveExercise = (index: number, direction: -1 | 1) => {
    setSelectedIds((current) => {
      const target = index + direction;
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target]!, next[index]!];
      return next;
    });
  };

  const updatePrescription = (id: string, field: keyof PrescriptionFields, value: string) => {
    setPrescriptions((current) => ({
      ...current,
      [id]: { ...(current[id] ?? emptyFields), [field]: value },
    }));
  };

  const startCustomization = () => {
    if (!selectedIds.length) return;
    setStage("customize");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const generatePdf = async () => {
    setIsGenerating(true);
    setNotice("");
    try {
      const result = await createExercisePdf({
        professional,
        patient,
        items: selectedExercises.map((exercise) => ({
          exercise,
          ...(prescriptions[exercise.id] ?? emptyFields),
        })),
      });
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
      const nextUrl = URL.createObjectURL(result.blob);
      setPdfBlob(result.blob);
      setPdfUrl(nextUrl);
      setFileName(result.fileName);
      setStage("preview");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setNotice("Não foi possível gerar a ficha. Tente novamente.");
    } finally {
      setIsGenerating(false);
    }
  };

  const sharePdf = async () => {
    if (!pdfBlob) return;
    const file = new File([pdfBlob], fileName, { type: "application/pdf" });
    const message = "Olá! Segue sua ficha de orientações de exercícios.";
    if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) {
      try {
        await navigator.share({
          title: "Orientações de exercícios",
          text: message,
          files: [file],
        });
        setNotice("Ficha compartilhada com sucesso.");
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }
    downloadBlob(pdfBlob, fileName);
    window.open(
      `https://wa.me/?text=${encodeURIComponent(
        `${message} O PDF foi baixado neste aparelho para você anexar à conversa.`,
      )}`,
      "_blank",
      "noopener,noreferrer",
    );
    setNotice("O PDF foi baixado. Anexe-o na conversa do WhatsApp que acabou de abrir.");
  };

  const goToLibrary = () => {
    setStage("library");
    window.setTimeout(() => libraryRef.current?.scrollIntoView({ behavior: "smooth" }), 30);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/80 bg-white/95 backdrop-blur">
        <div className="container-app flex h-18 items-center justify-between gap-4">
          <button type="button" onClick={goToLibrary} className="flex items-center gap-3 text-left">
            <span className="grid size-10 place-items-center rounded-xl bg-primary text-white shadow-sm">
              <span className="relative block size-5">
                <span className="absolute left-2 top-0 h-5 w-1 rounded-full bg-white" />
                <span className="absolute left-0 top-2 h-1 w-5 rounded-full bg-white" />
              </span>
            </span>
            <span>
              <span className="block text-lg font-bold tracking-tight">Fisio Express</span>
              <span className="hidden text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground sm:block">
                Prescrição simplificada
              </span>
            </span>
          </button>

          <nav className="hidden items-center gap-7 text-sm font-semibold text-slate-600 md:flex">
            <button type="button" onClick={goToLibrary} className="hover:text-primary">
              Biblioteca
            </button>
            <button type="button" onClick={startCustomization} className="hover:text-primary">
              Minha ficha {selectedIds.length > 0 && `(${selectedIds.length})`}
            </button>
            <span className="rounded-full bg-mint px-3 py-1 text-xs font-bold text-primary">
              Biblioteca profissional
            </span>
          </nav>
          <button
            type="button"
            onClick={() => setPlansOpen(true)}
            className="ml-auto inline-flex items-center gap-2 rounded-full border border-green/30 bg-mint px-3 py-2 text-xs font-bold text-primary md:ml-0"
            aria-label="Plano Free — conhecer o Plus"
          >
            Plano Free <span className="hidden text-green sm:inline">Ver Plus</span>
          </button>
          <button
            type="button"
            aria-label="Abrir menu"
            className="rounded-lg border border-border p-2 md:hidden"
            onClick={() => setMobileMenu((open) => !open)}
          >
            {mobileMenu ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
        {mobileMenu && (
          <div className="border-t border-border bg-white px-5 py-4 md:hidden">
            <button
              type="button"
              onClick={goToLibrary}
              className="block w-full py-2 text-left font-semibold"
            >
              Biblioteca
            </button>
            <button
              type="button"
              onClick={startCustomization}
              className="block w-full py-2 text-left font-semibold"
            >
              Minha ficha ({selectedIds.length})
            </button>
          </div>
        )}
      </header>

      {stage === "library" && (
        <>
          <section className="hero-grid border-b border-border bg-hero">
            <div className="container-app grid gap-8 py-10 md:py-14">
              <div>
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/10 bg-white px-3 py-1.5 text-xs font-bold text-primary shadow-sm">
                  <Sparkles className="size-3.5 text-green" /> Sua biblioteca de exercícios
                </div>
                <h1 className="max-w-3xl text-4xl font-bold leading-[1.08] tracking-[-0.035em] text-primary md:text-5xl lg:text-[3.6rem]">
                  Encontre o exercício ideal em <span className="text-green">segundos.</span>
                </h1>
                <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-600 md:text-lg">
                  Pesquise por região do corpo e monte orientações personalizadas para seus
                  pacientes. Escolha, personalize e baixe sua ficha em PDF.
                </p>
                <div className="relative mt-8 max-w-2xl">
                  <Search className="absolute left-5 top-1/2 size-5 -translate-y-1/2 text-green" />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    aria-label="Buscar exercícios"
                    placeholder="Qual exercício você está procurando? Ex.: ombro, cervical, joelho..."
                    className="h-16 w-full rounded-2xl border border-slate-200 bg-white pl-14 pr-5 text-sm shadow-search outline-none transition focus:border-green focus:ring-4 focus:ring-green/10 md:text-base"
                  />
                </div>
              </div>

              <section aria-labelledby="como-funciona">
                <h2 id="como-funciona" className="text-xl font-bold text-primary md:text-2xl">
                  Sua ficha em 3 passos
                </h2>
                <ol className="mt-5 grid gap-4 md:grid-cols-3">
                  {[
                    {
                      icon: Search,
                      title: "Encontre o exercício",
                      description: "Escolha a região do corpo ou pesquise pelo nome.",
                      action: "Pesquise e escolha",
                    },
                    {
                      icon: ClipboardList,
                      title: "Monte sua ficha",
                      description: "Adicione os exercícios e ajuste as séries e repetições.",
                      action: "Ajuste para seu paciente",
                    },
                    {
                      icon: Download,
                      title: "Baixe o PDF",
                      description: "Sua ficha fica pronta para imprimir ou enviar ao paciente.",
                      action: "Pronto para enviar",
                    },
                  ].map(({ icon: Icon, title, description, action }, index) => (
                    <li
                      key={title}
                      className="relative rounded-2xl border border-border bg-white p-5 shadow-soft"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="grid size-9 place-items-center rounded-full bg-primary text-sm font-bold text-white">
                          {index + 1}
                        </span>
                        <Icon aria-hidden="true" className="size-7 text-green" />
                      </div>
                      <h3 className="mt-4 text-lg font-bold text-primary">{title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-slate-600">{description}</p>
                      <div
                        aria-hidden="true"
                        className="mt-5 flex items-center gap-2 rounded-xl bg-mint px-3 py-3 text-xs font-semibold text-primary"
                      >
                        {index === 2 ? (
                          <FileText className="size-4 shrink-0 text-green" />
                        ) : (
                          <Check className="size-4 shrink-0 text-green" />
                        )}
                        {action}
                      </div>
                    </li>
                  ))}
                </ol>
              </section>

              <div className="relative mx-auto mt-3 w-full max-w-xl">
                <div className="absolute -inset-5 rounded-[2.5rem] bg-green/8" />
                <div className="relative rounded-3xl border border-white bg-white p-5 shadow-card">
                  <div className="flex items-center justify-between border-b border-border pb-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-green">
                        Veja como sua ficha vai ficar
                      </p>
                      <p className="mt-1 font-bold text-primary">
                        Organizada. Ilustrada. Personalizada.
                      </p>
                    </div>
                    <ClipboardList className="size-6 text-green" />
                  </div>
                  {[exercises[10]!, exercises[60]!, exercises[70]!].map((exercise) => (
                    <div
                      key={exercise.id}
                      className="flex items-center gap-3 border-b border-border/70 py-3 last:border-0"
                    >
                      <ExerciseIllustration
                        image={exercise.image}
                        alt={exercise.name}
                        className="size-14 rounded-xl"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold">{exercise.name}</p>
                        <p className="mt-1 text-xs text-slate-500">{exercise.region}</p>
                      </div>
                      <Check className="ml-auto size-4 shrink-0 text-green" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <main ref={libraryRef} className="container-app scroll-mt-24 py-10 lg:py-14">
            <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div>
                <p className="eyebrow">Biblioteca de exercícios</p>
                <h2 className="mt-2 text-2xl font-bold tracking-tight text-primary md:text-3xl">
                  Explore por região do corpo
                </h2>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-mint px-3 py-2 text-xs text-primary">
                <Info className="size-4 shrink-0" /> Individualize as orientações conforme sua
                avaliação.
              </div>
            </div>

            <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-white p-4 shadow-soft">
              <div className="flex flex-wrap items-center gap-3">
                <div
                  className="flex rounded-lg bg-slate-100 p-1"
                  aria-label="Origem dos exercícios"
                >
                  <button
                    type="button"
                    aria-pressed={!customOnly}
                    onClick={() => {
                      setCustomOnly(false);
                      setActiveCategory("Cervical");
                      setSearch("");
                    }}
                    className={`rounded-md px-3 py-2 text-sm font-semibold ${!customOnly ? "bg-white text-primary shadow-sm" : "text-slate-500"}`}
                  >
                    Biblioteca
                  </button>
                  <button
                    type="button"
                    aria-pressed={customOnly}
                    onClick={() => {
                      setCustomOnly(true);
                      setActiveCategory("");
                    }}
                    className={`rounded-md px-3 py-2 text-sm font-semibold ${customOnly ? "bg-white text-primary shadow-sm" : "text-slate-500"}`}
                  >
                    Meus exercícios
                  </button>
                </div>
              </div>
              <button
                type="button"
                disabled={!storageReady || storageBusy}
                onClick={() => setEditor(null)}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-bold text-white disabled:opacity-50"
              >
                <Plus className="size-4" /> Novo exercício
              </button>
            </div>
            {storageError && (
              <p role="alert" className="mb-5 rounded-lg bg-red-50 p-4 text-sm text-red-800">
                {storageError}
              </p>
            )}
            {customOnly && (
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-mint p-4">
                <p className="max-w-xl text-xs leading-relaxed text-primary">
                  Seus exercícios ficam neste navegador. Exporte um backup antes de trocar de
                  aparelho ou limpar os dados. O backup não inclui informações de pacientes.
                </p>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={exportExercises}
                    disabled={!storageReady || !customExercises.length || storageBusy}
                    className="text-sm font-bold text-primary underline disabled:opacity-40"
                  >
                    Exportar backup
                  </button>
                  <button
                    type="button"
                    onClick={() => importRef.current?.click()}
                    disabled={!storageReady || storageBusy}
                    className="text-sm font-bold text-primary underline disabled:opacity-40"
                  >
                    {storageBusy ? "Importando…" : "Importar backup"}
                  </button>
                </div>
              </div>
            )}
            <input
              ref={importRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              aria-label="Arquivo de backup"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void importExercises(file);
                event.target.value = "";
              }}
            />
            <div className="mb-8 flex flex-wrap gap-2" aria-label="Regiões do corpo">
              {regionFilters.map((region) => (
                <button
                  key={region}
                  type="button"
                  aria-pressed={activeCategory === region}
                  onClick={() => {
                    setActiveCategory(customOnly && activeCategory === region ? "" : region);
                    setSearch("");
                  }}
                  className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${activeCategory === region ? "border-primary bg-primary text-white shadow-sm" : "border-border bg-white text-slate-600 hover:border-green hover:text-primary"}`}
                >
                  {region}
                </button>
              ))}
            </div>

            <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_330px]">
              <section>
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-primary">
                      {customOnly ? "Seus exercícios" : activeCategory}
                    </p>
                    {!customOnly && (
                      <p className="mt-1 text-xs text-slate-500">Explore a prévia do Plano Free.</p>
                    )}
                  </div>
                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch("")}
                      className="text-sm font-semibold text-green hover:underline"
                    >
                      Limpar busca
                    </button>
                  )}
                </div>

                {visibleExercises.length ? (
                  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-2 2xl:grid-cols-3">
                    {visibleExercises.map((exercise) => {
                      const selected = selectedIds.includes(exercise.id);
                      return (
                        <article
                          key={exercise.id}
                          className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-soft transition hover:-translate-y-0.5 hover:border-green/40 hover:shadow-card"
                        >
                          <div className="relative p-3 pb-0">
                            <ExerciseIllustration
                              image={exercise.image}
                              alt={exercise.name}
                              className="aspect-[5/3] w-full rounded-xl"
                            />
                          </div>
                          <div className="flex flex-1 flex-col p-5">
                            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.11em] text-green">
                              {exercise.region}
                              <span className="size-1 rounded-full bg-slate-300" />
                              {exercise.category}
                            </div>
                            <h3 className="mt-2 text-lg font-bold leading-snug text-primary">
                              {exercise.name}
                            </h3>
                            <p className="mt-2 text-sm leading-relaxed text-slate-500">
                              {exercise.summary}
                            </p>
                            {exercise.custom && (
                              <div className="mt-4 flex gap-4 text-xs font-semibold">
                                <button
                                  type="button"
                                  onClick={() => setEditor(exercise)}
                                  className="text-green hover:underline"
                                  aria-label={`Editar ${exercise.name}`}
                                >
                                  Editar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeleting(exercise)}
                                  className="text-red-700 hover:underline"
                                  aria-label={`Excluir ${exercise.name}`}
                                >
                                  Excluir
                                </button>
                              </div>
                            )}
                            <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
                              <span className="text-xs text-slate-400">{exercise.equipment}</span>
                              <button
                                type="button"
                                onClick={() =>
                                  selected ? removeExercise(exercise.id) : addExercise(exercise)
                                }
                                className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-bold transition ${
                                  selected
                                    ? "bg-mint text-primary"
                                    : "bg-primary text-white hover:bg-primary-light"
                                }`}
                              >
                                {selected ? (
                                  <Check className="size-4" />
                                ) : (
                                  <Plus className="size-4" />
                                )}
                                {selected ? "Adicionado" : "Adicionar à ficha"}
                              </button>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
                    <Search className="mx-auto size-8 text-slate-300" />
                    <h3 className="mt-4 font-bold text-primary">Nenhum exercício encontrado</h3>
                    <p className="mt-2 text-sm text-slate-500">
                      Tente buscar por região, movimento ou equipamento.
                    </p>
                  </div>
                )}
                {!customOnly && (
                  <section
                    className="mt-8 overflow-hidden rounded-2xl border border-green/25 bg-primary p-6 text-white shadow-card md:p-8"
                    aria-label="Continue com o Plano Plus"
                  >
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-green-light">
                      Fisio Express Plus
                    </p>
                    <h3 className="mt-3 text-2xl font-bold tracking-tight">
                      Sua biblioteca pode ir além.
                    </h3>
                    <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/75">
                      Você está explorando uma prévia gratuita desta região. Conheça o Plus para
                      continuar com a biblioteca completa e preparar suas orientações com mais
                      possibilidades.
                    </p>
                    <div className="mt-6 flex flex-wrap items-center gap-4">
                      <button
                        type="button"
                        onClick={() => setPlansOpen(true)}
                        className="inline-flex items-center gap-2 rounded-xl bg-green px-5 py-3 text-sm font-bold text-white transition hover:bg-green-dark"
                      >
                        Assinar plano Plus <ArrowRight className="size-4" />
                      </button>
                      <span className="text-xs text-white/65">Mensal ou anual. Você escolhe.</span>
                    </div>
                  </section>
                )}
              </section>

              <SelectionPanel
                selectedExercises={selectedExercises}
                onRemove={removeExercise}
                onMove={moveExercise}
                onContinue={startCustomization}
              />
            </div>
          </main>
        </>
      )}

      {stage === "customize" && (
        <CustomizationView
          professional={professional}
          patient={patient}
          selectedExercises={selectedExercises}
          prescriptions={prescriptions}
          isGenerating={isGenerating}
          onProfessional={setProfessional}
          onPatient={setPatient}
          onUpdate={updatePrescription}
          onBack={goToLibrary}
          onGenerate={generatePdf}
        />
      )}

      {stage === "preview" && pdfBlob && (
        <PreviewView
          pdfUrl={pdfUrl}
          fileName={fileName}
          pdfBlob={pdfBlob}
          selectedCount={selectedIds.length}
          notice={notice}
          onBack={() => setStage("customize")}
          onDownload={() => downloadBlob(pdfBlob, fileName)}
          onShare={sharePdf}
        />
      )}

      <footer className="container-app border-t border-border py-8 text-xs leading-relaxed text-slate-500">
        <p className="font-bold text-primary">Fisio Express</p>
        <p className="mt-2">
          Organização de exercícios e orientações para fisioterapeutas. A seleção e a prescrição
          devem ser individualizadas pelo profissional responsável.
        </p>
        <p className="mt-2">
          Exercícios ilustrados em português • Orientações personalizadas • Exercícios próprios com
          backup
        </p>
      </footer>
      {editor !== undefined && (
        <CustomExerciseDialog
          key={editor?.id ?? "new"}
          initial={editor}
          onClose={() => setEditor(undefined)}
          onSave={saveExercise}
        />
      )}
      <PlansDialog open={plansOpen} onOpenChange={setPlansOpen} />
      <Dialog
        open={!!deleting}
        onOpenChange={(open) => {
          if (!open && !storageBusy) setDeleting(null);
        }}
      >
        <DialogContent className="w-[calc(100%-24px)] rounded-2xl bg-white">
          <DialogTitle>Excluir exercício?</DialogTitle>
          <DialogDescription>
            O exercício “{deleting?.name}” será removido deste navegador e da ficha atual. Exporte
            um backup se desejar guardar uma cópia.
          </DialogDescription>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              disabled={storageBusy}
              onClick={() => setDeleting(null)}
              className="rounded-lg border border-border px-4 py-2"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={storageBusy}
              onClick={async () => {
                if (!deleting) return;
                setStorageBusy(true);
                try {
                  await writeCustomExercises([], deleting.id);
                  setCustomExercises((items) => items.filter((item) => item.id !== deleting.id));
                  removeExercise(deleting.id);
                  setDeleting(null);
                  setNotice("Exercício excluído.");
                } catch {
                  setNotice("Não foi possível excluir. Tente novamente.");
                } finally {
                  setStorageBusy(false);
                }
              }}
              className="rounded-lg bg-red-700 px-4 py-2 text-white"
            >
              {storageBusy ? "Excluindo…" : "Excluir exercício"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
      {notice && stage !== "preview" && (
        <div
          role="status"
          className="fixed bottom-24 left-1/2 z-[60] w-[calc(100%-32px)] max-w-lg -translate-x-1/2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white shadow-card md:bottom-6"
        >
          {notice}
        </div>
      )}

      {stage === "library" && selectedIds.length > 0 && (
        <div className="fixed inset-x-3 bottom-3 z-40 rounded-2xl bg-primary p-3 text-white shadow-card xl:hidden">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 pl-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-white/60">
                Minha ficha
              </p>
              <p className="truncate text-sm font-bold">
                {selectedIds.length}{" "}
                {selectedIds.length === 1 ? "exercício selecionado" : "exercícios selecionados"}
              </p>
            </div>
            <button
              type="button"
              onClick={startCustomization}
              className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-green px-4 py-3 text-sm font-bold text-white"
            >
              Montar orientação <ArrowRight className="size-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function SelectionPanel({
  selectedExercises,
  onRemove,
  onMove,
  onContinue,
}: {
  selectedExercises: Exercise[];
  onRemove: (id: string) => void;
  onMove: (index: number, direction: -1 | 1) => void;
  onContinue: () => void;
}) {
  return (
    <aside className="sticky top-24 hidden h-fit overflow-hidden rounded-2xl border border-border bg-white shadow-card xl:block">
      <div className="flex items-center justify-between border-b border-border bg-primary px-5 py-4 text-white">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/60">
            Minha ficha
          </p>
          <p className="mt-1 font-bold">
            {selectedExercises.length} {selectedExercises.length === 1 ? "exercício" : "exercícios"}
          </p>
        </div>
        <ClipboardList className="size-6 text-green-light" />
      </div>

      {selectedExercises.length ? (
        <div>
          <div className="max-h-[430px] divide-y divide-border overflow-y-auto px-4">
            {selectedExercises.map((exercise, index) => (
              <div key={exercise.id} className="flex items-center gap-3 py-3.5">
                <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-mint text-xs font-bold text-primary">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-primary">{exercise.name}</p>
                  <p className="text-xs text-slate-400">{exercise.region}</p>
                </div>
                <div className="flex items-center">
                  <button
                    type="button"
                    aria-label="Mover para cima"
                    disabled={index === 0}
                    onClick={() => onMove(index, -1)}
                    className="p-1 text-slate-400 disabled:opacity-25"
                  >
                    <ChevronUp className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    aria-label="Mover para baixo"
                    disabled={index === selectedExercises.length - 1}
                    onClick={() => onMove(index, 1)}
                    className="p-1 text-slate-400 disabled:opacity-25"
                  >
                    <ChevronDown className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    aria-label="Remover exercício"
                    onClick={() => onRemove(exercise.id)}
                    className="ml-1 p-1 text-slate-400 hover:text-red-600"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-border p-4">
            <button
              type="button"
              onClick={onContinue}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-green px-4 py-3.5 text-sm font-bold text-white shadow-sm hover:bg-green-dark"
            >
              Montar orientação <ArrowRight className="size-4" />
            </button>
            <p className="mt-3 text-center text-[11px] leading-relaxed text-slate-400">
              Você poderá ajustar séries, repetições e observações.
            </p>
          </div>
        </div>
      ) : (
        <div className="px-6 py-12 text-center">
          <ClipboardList className="mx-auto size-8 text-slate-300" />
          <p className="mt-4 text-sm font-bold text-primary">Sua ficha está vazia</p>
          <p className="mt-2 text-xs leading-relaxed text-slate-400">
            Adicione exercícios da biblioteca para começar.
          </p>
        </div>
      )}
    </aside>
  );
}

function CustomizationView({
  professional,
  patient,
  selectedExercises,
  prescriptions,
  isGenerating,
  onProfessional,
  onPatient,
  onUpdate,
  onBack,
  onGenerate,
}: {
  professional: string;
  patient: string;
  selectedExercises: Exercise[];
  prescriptions: Record<string, PrescriptionFields>;
  isGenerating: boolean;
  onProfessional: (value: string) => void;
  onPatient: (value: string) => void;
  onUpdate: (id: string, field: keyof PrescriptionFields, value: string) => void;
  onBack: () => void;
  onGenerate: () => void;
}) {
  return (
    <main className="container-narrow py-10 md:py-14">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-primary"
      >
        <ArrowLeft className="size-4" /> Voltar à biblioteca
      </button>
      <div className="mt-8 flex flex-col justify-between gap-4 border-b border-border pb-8 md:flex-row md:items-end">
        <div>
          <p className="eyebrow">Etapa 2 de 3</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-primary md:text-4xl">
            Personalize a orientação
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-500">
            Preencha apenas o que fizer sentido para sua avaliação. Nenhum dado é enviado ou salvo
            em servidor.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-mint px-4 py-3 text-xs font-semibold text-primary">
          <ShieldCheck className="size-5 text-green" /> Dados somente nesta sessão
        </div>
      </div>

      <section className="mt-8 rounded-2xl border border-border bg-white p-5 shadow-soft md:p-7">
        <div className="mb-5 flex items-center gap-3">
          <span className="grid size-8 place-items-center rounded-lg bg-primary text-sm font-bold text-white">
            1
          </span>
          <div>
            <h2 className="font-bold text-primary">Identificação</h2>
            <p className="text-xs text-slate-400">Campos opcionais exibidos no PDF</p>
          </div>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <TextField
            label="Nome do profissional"
            value={professional}
            onChange={onProfessional}
            placeholder="Ex.: Dra. Marina Silva — CREFITO 000000-F"
          />
          <TextField
            label="Identificação do paciente"
            value={patient}
            onChange={onPatient}
            placeholder="Ex.: Ana M. ou código interno"
          />
        </div>
      </section>

      <div className="mt-8 flex items-center gap-3">
        <span className="grid size-8 place-items-center rounded-lg bg-primary text-sm font-bold text-white">
          2
        </span>
        <div>
          <h2 className="font-bold text-primary">Exercícios e orientações</h2>
          <p className="text-xs text-slate-400">Ajuste cada item conforme sua avaliação</p>
        </div>
      </div>

      <div className="mt-5 space-y-5">
        {selectedExercises.map((exercise, index) => {
          const values = prescriptions[exercise.id] ?? emptyFields;
          return (
            <article
              key={exercise.id}
              className="overflow-hidden rounded-2xl border border-border bg-white shadow-soft"
            >
              <div className="grid md:grid-cols-[190px_1fr]">
                <div className="relative bg-mint p-5">
                  <span className="absolute left-4 top-4 z-10 grid size-7 place-items-center rounded-lg bg-primary text-xs font-bold text-white">
                    {index + 1}
                  </span>
                  <ExerciseIllustration
                    image={exercise.image}
                    alt={exercise.name}
                    className="mx-auto aspect-square w-full max-w-[150px]"
                  />
                </div>
                <div className="p-5 md:p-6">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-green">
                    {exercise.region} · {exercise.category}
                  </p>
                  <h3 className="mt-1 text-xl font-bold text-primary">{exercise.name}</h3>
                  <ol className="mt-3 list-inside list-decimal space-y-2 text-sm leading-relaxed text-slate-600">
                    {exercise.instructions.map((line, i) => (
                      <li key={i}>{line}</li>
                    ))}
                  </ol>
                  {exercise.notes && (
                    <p className="mt-3 rounded-lg bg-mint p-3 text-sm text-primary">
                      {exercise.notes}
                    </p>
                  )}

                  <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
                    <TextField
                      compact
                      label="Séries"
                      value={values.series}
                      onChange={(value) => onUpdate(exercise.id, "series", value)}
                      placeholder="Ex.: 3"
                    />
                    <TextField
                      compact
                      label="Repetições"
                      value={values.repetitions}
                      onChange={(value) => onUpdate(exercise.id, "repetitions", value)}
                      placeholder="Ex.: 10"
                    />
                    <TextField
                      compact
                      label="Tempo"
                      value={values.duration}
                      onChange={(value) => onUpdate(exercise.id, "duration", value)}
                      placeholder="Ex.: 30 s"
                    />
                    <TextField
                      compact
                      label="Frequência"
                      value={values.frequency}
                      onChange={(value) => onUpdate(exercise.id, "frequency", value)}
                      placeholder="Ex.: 1x/dia"
                    />
                  </div>
                  <label className="mt-4 block">
                    <span className="mb-2 block text-xs font-bold text-slate-600">
                      Observações individuais
                    </span>
                    <textarea
                      value={values.observation}
                      onChange={(event) => onUpdate(exercise.id, "observation", event.target.value)}
                      rows={2}
                      placeholder="Orientações específicas para este exercício..."
                      className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm outline-none transition focus:border-green focus:bg-white focus:ring-3 focus:ring-green/10"
                    />
                  </label>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <div className="mt-8 flex flex-col items-center justify-between gap-4 rounded-2xl bg-primary p-5 text-white md:flex-row md:p-7">
        <div>
          <p className="font-bold">Sua ficha está pronta para ser gerada</p>
          <p className="mt-1 text-sm text-white/65">
            {selectedExercises.length} {selectedExercises.length === 1 ? "exercício" : "exercícios"}{" "}
            · PDF A4 · dados locais
          </p>
        </div>
        <button
          type="button"
          disabled={isGenerating}
          onClick={onGenerate}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-green px-6 py-3.5 text-sm font-bold text-white shadow-sm hover:bg-green-dark disabled:opacity-60 md:w-auto"
        >
          <FileText className="size-5" />
          {isGenerating ? "Gerando ficha..." : "Gerar ficha de exercícios"}
        </button>
      </div>
    </main>
  );
}

function PreviewView({
  pdfUrl,
  fileName,
  pdfBlob,
  selectedCount,
  notice,
  onBack,
  onDownload,
  onShare,
}: {
  pdfUrl: string;
  fileName: string;
  pdfBlob: Blob;
  selectedCount: number;
  notice: string;
  onBack: () => void;
  onDownload: () => void;
  onShare: () => void;
}) {
  return (
    <main className="container-narrow py-10 md:py-14">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-primary"
      >
        <ArrowLeft className="size-4" /> Editar orientação
      </button>
      <div className="mt-8 rounded-3xl bg-primary px-6 py-8 text-white md:px-10">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div className="flex items-start gap-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-green">
              <Check className="size-6" />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-green-light">
                Ficha gerada com sucesso
              </p>
              <h1 className="mt-2 text-2xl font-bold md:text-3xl">Sua orientação está pronta</h1>
              <p className="mt-2 text-sm text-white/65">
                {selectedCount}{" "}
                {selectedCount === 1 ? "exercício organizado" : "exercícios organizados"} em um PDF
                profissional.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <a
              href={pdfUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-bold hover:bg-white/15"
            >
              <ExternalLink className="size-4" /> Abrir PDF
            </a>
            <button
              type="button"
              onClick={onDownload}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-bold text-primary hover:bg-slate-50"
            >
              <Download className="size-4" /> Baixar PDF
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_300px]">
        <section className="overflow-hidden rounded-2xl border border-border bg-slate-100 shadow-soft">
          <div className="flex items-center justify-between border-b border-border bg-white px-4 py-3">
            <div className="flex items-center gap-2 text-sm font-bold text-primary">
              <FileText className="size-4 text-green" /> Pré-visualização
            </div>
            <span className="max-w-[190px] truncate text-xs text-slate-400">{fileName}</span>
          </div>
          <object
            data={pdfUrl}
            type="application/pdf"
            className="h-[680px] w-full"
            aria-label="Pré-visualização da ficha em PDF"
          >
            <div className="p-8 text-center text-sm text-slate-500">
              Seu navegador não exibe PDF nesta tela. Use “Abrir PDF” ou “Baixar PDF”.
            </div>
          </object>
        </section>

        <aside className="h-fit rounded-2xl border border-border bg-white p-5 shadow-soft lg:sticky lg:top-24">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-[#e7f7ed] text-[#16854a]">
              <MessageCircle className="size-5" />
            </span>
            <div>
              <h2 className="font-bold text-primary">Compartilhar</h2>
              <p className="text-xs text-slate-400">Envie pelo celular ou WhatsApp</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onShare}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#1fa855] px-4 py-3.5 text-sm font-bold text-white hover:bg-[#198d48]"
          >
            <Share2 className="size-4" /> Enviar pelo WhatsApp
          </button>
          <div className="mt-4 rounded-xl bg-slate-50 p-3 text-xs leading-relaxed text-slate-500">
            No celular, tentaremos compartilhar o PDF diretamente. Se o navegador não permitir
            anexos, o arquivo será baixado e o WhatsApp abrirá com uma mensagem pronta.
          </div>
          {notice && (
            <p
              role="status"
              className="mt-4 rounded-xl bg-mint p-3 text-xs font-semibold leading-relaxed text-primary"
            >
              {notice}
            </p>
          )}
          <div className="mt-5 border-t border-border pt-5">
            <p className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <ShieldCheck className="size-4 text-green" /> PDF gerado no seu navegador
            </p>
            <p className="mt-2 text-[11px] leading-relaxed text-slate-400">
              Nenhuma identificação do paciente foi enviada para serviços externos.
            </p>
          </div>
          <span className="sr-only">{pdfBlob.size} bytes</span>
        </aside>
      </div>
    </main>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  compact = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  compact?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold text-slate-600">{label}</span>
      <input
        value={value}
        maxLength={150}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={`w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-sm outline-none transition focus:border-green focus:bg-white focus:ring-3 focus:ring-green/10 ${
          compact ? "h-11" : "h-12"
        }`}
      />
    </label>
  );
}
