import { createClientOnlyFn } from "@tanstack/react-start";
import type { Exercise } from "@/data/exercises";

export type PrescriptionItem = {
  exercise: Exercise;
  series: string;
  repetitions: string;
  duration: string;
  frequency: string;
  observation: string;
};

export type Prescription = {
  professional: string;
  patient: string;
  items: PrescriptionItem[];
};

type PdfDocument = InstanceType<(typeof import("jspdf"))["jsPDF"]>;

function cleanFileName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

function addHeader(doc: PdfDocument, professional: string, patient: string) {
  doc.setFillColor(18, 56, 82);
  doc.rect(0, 0, 210, 31, "F");
  doc.setFillColor(57, 168, 142);
  doc.circle(18, 15, 7, "F");
  doc.setTextColor(255, 255, 255);
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(1.2);
  doc.line(14.5, 15, 21.5, 15);
  doc.line(18, 11.5, 18, 18.5);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Fisio Express", 29, 13);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("ORIENTAÇÕES DE EXERCÍCIOS", 29, 20);
  doc.setTextColor(18, 56, 82);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text(
    doc.splitTextToSize(patient ? `Paciente: ${patient}` : "Orientação personalizada", 140),
    15,
    41,
  );
  doc.setFont("helvetica", "normal");
  const date = new Intl.DateTimeFormat("pt-BR").format(new Date());
  doc.text(`Data: ${date}`, 195, 41, { align: "right" });
  if (professional) doc.text(doc.splitTextToSize(`Profissional: ${professional}`, 180), 15, 53);
}

function addFooter(doc: PdfDocument, page: number) {
  doc.setDrawColor(219, 229, 232);
  doc.line(15, 283, 195, 283);
  doc.setTextColor(99, 115, 122);
  doc.setFontSize(7);
  doc.text(
    "Material personalizado pelo profissional responsável. Siga somente as orientações recebidas.",
    15,
    289,
  );
  doc.text(`${page}`, 195, 289, { align: "right" });
}

export const createExercisePdf = createClientOnlyFn(async (prescription: Prescription) => {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4", compress: true });

  doc.setProperties({
    title: "Orientações de exercícios | Fisio Express",
    creator: "Fisio Express",
  });
  let page = 0;
  for (const [index, item] of prescription.items.entries()) {
    if (page) doc.addPage();
    page += 1;
    addHeader(doc, prescription.professional, prescription.patient);
    let y = 72;
    if (item.exercise.image) {
      const response = await fetch(item.exercise.image);
      if (!response.ok) throw new Error("Não foi possível carregar a imagem do exercício.");
      const imageBlob = await response.blob();
      const data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(imageBlob);
      });
      const dimensions = doc.getImageProperties(data);
      const scale = Math.min(53 / dimensions.width, 65 / dimensions.height);
      const w = dimensions.width * scale,
        h = dimensions.height * scale;
      doc.addImage(data, dimensions.fileType, 15 + (53 - w) / 2, y, w, h, undefined, "FAST");
    }
    const paragraph = (text: string, bold = false, size = 9) => {
      doc.setFont("helvetica", bold ? "bold" : "normal");
      doc.setFontSize(size);
      doc.setTextColor(bold ? 18 : 53, bold ? 56 : 65, bold ? 82 : 70);
      const lines: string[] = doc.splitTextToSize(text, 120);
      const lineHeight = size * 0.3528 * 1.5;
      for (const line of lines) {
        if (y + lineHeight > 275) {
          addFooter(doc, page);
          doc.addPage();
          page += 1;
          addHeader(doc, prescription.professional, prescription.patient);
          y = 72;
          doc.setFont("helvetica", bold ? "bold" : "normal");
          doc.setFontSize(size);
          doc.setTextColor(bold ? 18 : 53, bold ? 56 : 65, bold ? 82 : 70);
        }
        doc.text(line, 75, y);
        y += lineHeight;
      }
      y += 3;
    };
    paragraph(`${index + 1}. ${item.exercise.name}`, true, 14);
    paragraph(`${item.exercise.region} | ${item.exercise.category}`, false, 8);
    paragraph("Como executar", true, 10);
    item.exercise.instructions.forEach((line, i) => paragraph(`${i + 1}. ${line}`));
    if (item.exercise.equipment) paragraph(`Equipamento: ${item.exercise.equipment}`, false, 8);
    if (item.exercise.notes) paragraph(item.exercise.notes, false, 9);
    paragraph("Prescrição individualizada", true, 10);
    const prescriptionLine = [
      item.series && `Séries: ${item.series}`,
      item.repetitions && `Repetições: ${item.repetitions}`,
      item.duration && `Tempo: ${item.duration}`,
      item.frequency && `Frequência: ${item.frequency}`,
    ]
      .filter(Boolean)
      .join(" | ");
    paragraph(prescriptionLine || "Conforme orientação do profissional responsável.");
    if (item.observation) {
      paragraph("Orientação do profissional", true, 10);
      paragraph(item.observation);
    }
    addFooter(doc, page);
  }
  const suffix = cleanFileName(prescription.patient || "exercicios");
  const fileName = `orientacoes-${suffix || "exercicios"}.pdf`;
  const blob = doc.output("blob");
  return { blob, fileName };
});

export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}
