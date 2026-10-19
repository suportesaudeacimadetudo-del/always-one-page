import library from "./library.json";
export type Exercise = {
  id: string;
  name: string;
  region: string;
  category: string;
  objective: string;
  summary: string;
  instructions: string[];
  equipment: string;
  notes: string;
  keywords: string[];
  image?: string;
  custom?: boolean;
  sourceId?: number;
};
export const regions = [
  "Cervical",
  "Ombro",
  "Cotovelo e punho",
  "Mão e dedos",
  "Coluna torácica",
  "Coluna lombar",
  "Quadril",
  "Joelho",
  "Tornozelo e pé",
  "Equilíbrio e função",
  "Outro",
] as const;
export const exerciseCategories = [
  "Mobilidade",
  "Alongamento",
  "Fortalecimento",
  "Respiração",
  "Equilíbrio",
  "Coordenação",
  "Outro",
] as const;
export const categories = ["Todos", ...regions, ...exerciseCategories.filter((x) => x !== "Outro")];
export const exercises: Exercise[] = library;
// Presentation preview only. Server-side entitlements must protect paid content
// when accounts and billing are connected; the static bundle is not a paywall.
export const freePreviewExercises = exercises.filter(
  (exercise) => exercises.filter((item) => item.region === exercise.region).indexOf(exercise) < 3,
);
export function normalizeSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function matchesExercise(exercise: Exercise, query: string) {
  const normalized = normalizeSearch(query);
  if (!normalized) return true;
  const searchable = normalizeSearch(
    [
      exercise.name,
      exercise.region,
      exercise.category,
      exercise.objective,
      exercise.summary,
      exercise.equipment,
      ...exercise.keywords,
    ].join(" "),
  );
  return normalized.split(/\s+/).every((term) => searchable.includes(term));
}
