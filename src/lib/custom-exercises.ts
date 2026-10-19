import type { Exercise } from "@/data/exercises";

export const MAX_BACKUP_BYTES = 25 * 1024 * 1024;
const DB_NAME = "fisio-express";
const STORE = "custom-exercises";

export function validateCustomExercise(value: unknown): Exercise {
  if (!value || typeof value !== "object") throw new Error("Exercício inválido.");
  const item = value as Record<string, unknown>;
  const text = (key: string, max: number, required = false) => {
    const value = item[key];
    if (typeof value !== "string" || value.length > max || (required && !value.trim()))
      throw new Error(`Campo inválido: ${key}.`);
    return value.trim();
  };
  const id = text("id", 100, true);
  if (!/^user-[a-zA-Z0-9-]+$/.test(id)) throw new Error("Identificador inválido.");
  if (
    !Array.isArray(item["instructions"]) ||
    !item["instructions"].length ||
    item["instructions"].length > 30 ||
    item["instructions"].some(
      (line) => typeof line !== "string" || !line.trim() || line.length > 1000,
    ) ||
    item["instructions"].join("\n").length > 6000
  )
    throw new Error("Informe instruções de até 6.000 caracteres.");
  const image = item["image"];
  if (
    image !== undefined &&
    (typeof image !== "string" ||
      image.length > 1_500_000 ||
      !/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(image))
  )
    throw new Error("Imagem inválida. Use JPEG, PNG ou WebP.");
  const result: Exercise = {
    id,
    name: text("name", 150, true),
    region: text("region", 80, true),
    category: text("category", 80, true),
    objective: text("objective", 200),
    summary: text("summary", 500),
    equipment: text("equipment", 200),
    notes: text("notes", 1500),
    instructions: item["instructions"] as string[],
    keywords: [],
    custom: true,
  };
  if (typeof image === "string") result.image = image;
  return result;
}

export function parseBackup(raw: string): Exercise[] {
  if (new TextEncoder().encode(raw).byteLength > MAX_BACKUP_BYTES)
    throw new Error("O backup deve ter até 25 MB.");
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error("O arquivo não é um backup JSON válido.");
  }
  if (
    data?.format !== "fisio-express-exercises" ||
    data.version !== 1 ||
    !Array.isArray(data.exercises) ||
    data.exercises.length > 500
  )
    throw new Error("Formato de backup incompatível.");
  const items: Exercise[] = data.exercises.map(validateCustomExercise);
  if (new Set(items.map((item) => item.id)).size !== items.length)
    throw new Error("O backup contém identificadores repetidos.");
  return items;
}

function database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE, { keyPath: "id" });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () =>
      reject(new Error("Feche outras abas do aplicativo e tente novamente."));
  });
}
export async function readCustomExercises(): Promise<Exercise[]> {
  const db = await database();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const request = tx.objectStore(STORE).getAll();
    tx.oncomplete = () => {
      db.close();
      try {
        resolve(request.result.map(validateCustomExercise));
      } catch (error) {
        reject(error);
      }
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
    tx.onabort = () => {
      db.close();
      reject(tx.error);
    };
  });
}
export async function writeCustomExercises(items: Exercise[], deleteId?: string): Promise<void> {
  const checked = items.map(validateCustomExercise);
  const db = await database();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    const store = tx.objectStore(STORE);
    checked.forEach((item) => store.put(item));
    if (deleteId) store.delete(deleteId);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
    tx.onabort = () => {
      db.close();
      reject(tx.error);
    };
  });
}

export async function prepareExerciseImage(file: File): Promise<string> {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024)
    throw new Error("Escolha uma imagem JPEG, PNG ou WebP de até 5 MB.");
  const image = await createImageBitmap(file);
  try {
    const scale = Math.min(1, 768 / Math.max(image.width, image.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Não foi possível preparar a imagem.");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.8);
  } finally {
    image.close();
  }
}
