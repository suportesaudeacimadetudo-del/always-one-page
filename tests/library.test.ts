import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { parseBackup, validateCustomExercise } from "../src/lib/custom-exercises.ts";

const exercise = {
  id: "user-test",
  name: "Exercício próprio",
  region: "Ombro",
  category: "Mobilidade",
  objective: "Mobilidade",
  summary: "Descrição",
  instructions: ["Primeira instrução.", "Segunda instrução."],
  equipment: "Cadeira",
  notes: "Orientação adicional.",
};
const backup = (exercises: unknown[]) =>
  JSON.stringify({ format: "fisio-express-exercises", version: 1, exercises });

test("biblioteca contém 100 IDs únicos e cada registro possui a imagem correspondente", () => {
  const items = JSON.parse(
    readFileSync(new URL("../src/data/library.json", import.meta.url), "utf8"),
  );
  assert.equal(items.length, 100);
  assert.equal(new Set(items.map((x: { id: string }) => x.id)).size, 100);
  for (const [index, item] of items.entries()) {
    assert.equal(item.sourceId, index + 1);
    assert.equal(item.image, `exercises/${String(index + 1).padStart(3, "0")}.jpg`);
    assert.ok(existsSync(new URL(`../public/${item.image}`, import.meta.url)));
    assert.ok(item.name && item.instructions.length && item.notes);
    assert.equal(item.translations, undefined);
  }
});
test("backup preserva textos, instruções e imagem e não aceita campos extras de paciente", () => {
  const image = "data:image/jpeg;base64,/9j/AA==";
  const [item] = parseBackup(backup([{ ...exercise, image, patient: "Não exportar" }]));
  assert.equal(item?.name, exercise.name);
  assert.deepEqual(item?.instructions, exercise.instructions);
  assert.equal(item?.image, image);
  assert.equal("patient" in item!, false);
  assert.equal(item?.custom, true);
});
test("imagem externa e SVG são rejeitados antes da gravação", () => {
  for (const image of [
    "https://example.com/image.jpg",
    "javascript:alert(1)",
    "data:image/svg+xml;base64,PHN2Zz4=",
  ])
    assert.throws(() => validateCustomExercise({ ...exercise, image }));
});
test("backup inteiro é validado e não aceita um registro inválido no meio dos demais", () => {
  assert.throws(() =>
    parseBackup(backup([exercise, { ...exercise, id: "user-other", instructions: [] }])),
  );
  assert.throws(() => parseBackup(backup([exercise, exercise])));
  assert.throws(() => parseBackup(backup([{ ...exercise, id: "library-001" }])));
  assert.throws(() => parseBackup("{invalid"));
  assert.throws(() => parseBackup(JSON.stringify({ format: "outro", version: 1, exercises: [] })));
});
test("limites impedem conteúdo excessivo e aceitam os limites documentados", () => {
  assert.throws(() => validateCustomExercise({ ...exercise, name: "a".repeat(151) }));
  assert.throws(() => validateCustomExercise({ ...exercise, instructions: ["a".repeat(1001)] }));
  assert.throws(() =>
    validateCustomExercise({ ...exercise, instructions: Array(31).fill("Passo") }),
  );
  assert.throws(() => validateCustomExercise({ ...exercise, notes: "a".repeat(1501) }));
  assert.equal(validateCustomExercise({ ...exercise, name: "a".repeat(150) }).name.length, 150);
  assert.deepEqual(parseBackup(backup([])), []);
});
