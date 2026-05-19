import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export async function simpleReportPdf({
  title,
  subtitle,
  lines,
}: {
  title: string;
  subtitle?: string;
  lines: string[];
}) {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const margin = 48;
  const fontSize = 11;
  const lineHeight = 16;

  function addPage() {
    return pdf.addPage([595.28, 841.89]); // A4
  }

  let page = addPage();
  let y = page.getHeight() - margin;

  page.drawText(title, {
    x: margin,
    y,
    size: 18,
    font: fontBold,
    color: rgb(0.05, 0.23, 0.47),
  });
  y -= 28;

  if (subtitle) {
    page.drawText(subtitle, {
      x: margin,
      y,
      size: 11,
      font,
      color: rgb(0.35, 0.35, 0.39),
    });
    y -= 22;
  }

  for (const line of lines) {
    if (y < margin + 40) {
      page = addPage();
      y = page.getHeight() - margin;
    }
    page.drawText(line, { x: margin, y, size: fontSize, font });
    y -= lineHeight;
  }

  const bytes = await pdf.save();
  return bytes;
}

