/**
 * Parser para archivos Excel exportados de SIGERD
 * Formato: "Relación de Estudiantes por Secciones"
 *
 * Cada hoja (sheet) contiene una sección con:
 * - Filas 0-24: encabezado con metadata (año escolar, regional, grado, sección, docente)
 * - Fila 25: headers de columnas
 * - Filas 26+: datos de estudiantes
 */
import * as XLSX from "xlsx";

export interface SigerdStudent {
  sigerdId: string;
  firstName: string;
  lastName: string;
  birthDate: string | null;
  grade: string;
  section: string;
  status: string;
}

export interface SigerdParseResult {
  schoolYear: string;
  students: SigerdStudent[];
  errors: string[];
}

/** Maps SIGERD grade names to our GradeCode enum */
const GRADE_MAP: Record<string, string> = {
  "pre-primaria": "PREPRIMARIO",
  "preprimario": "PREPRIMARIO",
  "kinder": "KINDER",
  "primero": "PRIMERO",
  "segundo": "SEGUNDO",
  "tercero": "TERCERO",
  "cuarto": "CUARTO",
  "quinto": "QUINTO",
  "sexto": "SEXTO",
};

function normalizeGrade(raw: string): string | null {
  const lower = raw.toLowerCase().trim();
  for (const [key, value] of Object.entries(GRADE_MAP)) {
    if (lower.includes(key)) return value;
  }
  return null;
}

function findCellValue(row: unknown[], searchText: string): string | null {
  for (let i = 0; i < row.length; i++) {
    const cell = row[i];
    if (typeof cell === "string" && cell.includes(searchText)) {
      // Look for value in subsequent cells
      for (let j = i + 1; j < row.length; j++) {
        if (row[j] !== null && row[j] !== undefined && row[j] !== "") {
          return String(row[j]);
        }
      }
    }
  }
  return null;
}

function parseExcelDate(value: unknown): string | null {
  if (!value) return null;
  const str = String(value);
  // SIGERD uses DD/MM/YYYY format
  const match = str.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (match) {
    const [, day, month, year] = match;
    return `${year}-${month}-${day}`;
  }
  return null;
}

export function parseSigerdExcel(buffer: ArrayBuffer): SigerdParseResult {
  const wb = XLSX.read(buffer, { type: "array" });
  const students: SigerdStudent[] = [];
  const errors: string[] = [];
  let schoolYear = "";

  for (const sheetName of wb.SheetNames) {
    const ws = wb.Sheets[sheetName];
    const rows: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });

    if (rows.length < 26) continue; // Skip empty/short sheets

    // Extract metadata from header rows
    let grade = "";
    let section = "";

    for (let i = 0; i < Math.min(25, rows.length); i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;

      // School year (row ~13)
      for (const cell of row) {
        if (typeof cell === "string" && /Año\s+\d{4}-\d{4}/.test(cell)) {
          schoolYear = cell.replace("Año ", "").trim();
        }
      }

      // Grade (row ~20, after "Grado:")
      const gradeVal = findCellValue(row as unknown[], "Grado:");
      if (gradeVal) {
        grade = normalizeGrade(gradeVal) || gradeVal;
      }

      // Also check for grade in the tanda line (e.g. "Primario - JORNADA EXTENDIDA" + "Grado:" + "Cuarto")
      // Sometimes the grade name is the last non-null cell
      const tandaGrade = findCellValue(row as unknown[], "Grado:");
      if (tandaGrade && !grade) {
        grade = normalizeGrade(tandaGrade) || tandaGrade;
      }

      // Section (row ~22, after "Sección:")
      const sectionVal = findCellValue(row as unknown[], "Sección:");
      if (sectionVal) {
        section = sectionVal.trim();
      }
    }

    if (!grade) {
      errors.push(`Hoja "${sheetName}": no se encontró el grado.`);
      continue;
    }

    // Find the header row (contains "Id Estudiante")
    let headerRowIdx = -1;
    for (let i = 20; i < Math.min(30, rows.length); i++) {
      const row = rows[i];
      if (row && row.some((cell) => typeof cell === "string" && cell.includes("Id Estudiante"))) {
        headerRowIdx = i;
        break;
      }
    }

    if (headerRowIdx === -1) {
      errors.push(`Hoja "${sheetName}": no se encontró la fila de encabezados.`);
      continue;
    }

    // Parse student data rows (after header)
    for (let i = headerRowIdx + 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length < 5) continue;

      // Filter out empty rows
      const nonEmpty = row.filter((c) => c !== null && c !== undefined && c !== "");
      if (nonEmpty.length < 3) continue;

      // Columns based on SIGERD format:
      // [0]=No.Orden, [1]=IdEstudiante, [2]=PrimerApellido, [3]=SegundoApellido, [4]=Nombres, [5]=Nacimiento, ...
      const sigerdId = row[1] != null ? String(row[1]) : "";
      const primerApellido = row[2] != null ? String(row[2]).trim() : "";
      const segundoApellido = row[3] != null ? String(row[3]).trim() : "";
      const nombres = row[4] != null ? String(row[4]).trim() : "";
      const nacimiento = row[5];

      if (!sigerdId || !primerApellido || !nombres) continue;

      const lastName = segundoApellido
        ? `${primerApellido} ${segundoApellido}`
        : primerApellido;

      // Get section and status from data row if available
      const rowSection = row[14] != null ? String(row[14]).trim() : section;
      const rowStatus = row[16] != null ? String(row[16]).trim() : "Inscrito";

      students.push({
        sigerdId,
        firstName: nombres,
        lastName,
        birthDate: parseExcelDate(nacimiento),
        grade,
        section: rowSection || section,
        status: rowStatus,
      });
    }
  }

  return { schoolYear, students, errors };
}
