/**
 * Parser para archivos Excel exportados de SIGERD
 * Formato: "Relación de Estudiantes por Secciones"
 *
 * Estructura del archivo:
 * - Múltiples hojas (sheets), una por sección
 * - Filas 0-24: encabezado con metadata (año escolar, regional, grado, sección)
 * - Una fila con "Id Estudiante" como header de columnas
 * - Filas siguientes: datos de estudiantes (columnas sparse/con muchas vacías)
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

/** Maps SIGERD grade labels to our GradeCode enum */
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

/**
 * Build a column index map from the header row.
 * The SIGERD report has many empty columns, so column positions vary.
 * We detect them dynamically by matching header labels.
 */
function buildColMap(headerRow: unknown[]): Record<string, number> {
  const map: Record<string, number> = {};
  const ALIASES: Record<string, string> = {
    "Id Estudiante": "sigerdId",
    "Primer apellido": "primerApellido",
    "Segundo apellido": "segundoApellido",
    "Nombre(s)": "nombres",
    "Nacimiento": "nacimiento",
    "Grado": "grade",
    "Sec.": "section",
    "Estado": "status",
    "Condición": "condicion",
  };
  headerRow.forEach((cell, idx) => {
    if (typeof cell === "string") {
      const key = ALIASES[cell.trim()];
      if (key) map[key] = idx;
    }
  });
  return map;
}

export function parseSigerdExcel(buffer: ArrayBuffer): SigerdParseResult {
  const wb = XLSX.read(buffer, { type: "array" });
  const students: SigerdStudent[] = [];
  const errors: string[] = [];
  let schoolYear = "";

  for (const sheetName of wb.SheetNames) {
    const ws = wb.Sheets[sheetName];
    const rows: unknown[][] = XLSX.utils.sheet_to_json(ws, {
      header: 1,
      defval: "",
    });

    if (rows.length < 20) continue;

    // Extract school year, grade and section from header rows
    let grade = "";
    let section = "";

    for (let i = 0; i < Math.min(25, rows.length); i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;

      // School year (row ~13, e.g. "Año 2025-2026")
      for (const cell of row) {
        if (typeof cell === "string" && /Año\s+\d{4}-\d{4}/.test(cell)) {
          schoolYear = cell.replace("Año ", "").trim();
        }
      }

      // Grade (look for "Grado:" label in each row)
      const gradeVal = findCellValue(row as unknown[], "Grado:");
      if (gradeVal) {
        grade = normalizeGrade(gradeVal) || gradeVal;
      }

      // Section (look for "Sección:" label)
      const sectionVal = findCellValue(row as unknown[], "Sección:");
      if (sectionVal) {
        section = sectionVal.charAt(0).toUpperCase();
      }
    }

    if (!grade) {
      errors.push(`Hoja "${sheetName}": no se encontró el grado.`);
      continue;
    }

    // Find the header row (contains "Id Estudiante")
    let headerRowIdx = -1;
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (
        row &&
        row.some(
          (cell) =>
            typeof cell === "string" && cell.trim() === "Id Estudiante",
        )
      ) {
        headerRowIdx = i;
        break;
      }
    }

    if (headerRowIdx === -1) {
      errors.push(`Hoja "${sheetName}": no se encontró la fila de encabezados.`);
      continue;
    }

    // Build dynamic column map from the header row
    const colMap = buildColMap(rows[headerRowIdx]);

    if (colMap.sigerdId === undefined) {
      errors.push(`Hoja "${sheetName}": columna "Id Estudiante" no encontrada.`);
      continue;
    }

    // Parse student data rows
    for (let i = headerRowIdx + 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;

      // Skip rows that are clearly empty (less than 3 non-empty cells)
      const nonEmpty = row.filter(
        (c) => c !== null && c !== undefined && c !== "",
      );
      if (nonEmpty.length < 3) continue;

      const sigerdId =
        colMap.sigerdId !== undefined && row[colMap.sigerdId] != null
          ? String(row[colMap.sigerdId]).trim()
          : "";

      const primerApellido =
        colMap.primerApellido !== undefined && row[colMap.primerApellido] != null
          ? String(row[colMap.primerApellido]).trim()
          : "";

      const segundoApellido =
        colMap.segundoApellido !== undefined &&
        row[colMap.segundoApellido] != null
          ? String(row[colMap.segundoApellido]).trim()
          : "";

      const nombres =
        colMap.nombres !== undefined && row[colMap.nombres] != null
          ? String(row[colMap.nombres]).trim()
          : "";

      const nacimiento =
        colMap.nacimiento !== undefined ? row[colMap.nacimiento] : null;

      // Grade and section from the data row take priority over sheet-level metadata
      const rowGradeRaw =
        colMap.grade !== undefined && row[colMap.grade] != null
          ? String(row[colMap.grade]).trim()
          : "";
      const rowGrade = rowGradeRaw
        ? normalizeGrade(rowGradeRaw) || grade
        : grade;

      const rowSection =
        colMap.section !== undefined && row[colMap.section] != null
          ? String(row[colMap.section]).trim().charAt(0).toUpperCase()
          : section;

      const rowStatus =
        colMap.status !== undefined && row[colMap.status] != null
          ? String(row[colMap.status]).trim()
          : "Inscrito";

      if (!sigerdId || !primerApellido || !nombres) continue;

      const lastName = segundoApellido
        ? `${primerApellido} ${segundoApellido}`
        : primerApellido;

      students.push({
        sigerdId,
        firstName: nombres,
        lastName,
        birthDate: parseExcelDate(nacimiento),
        grade: rowGrade,
        section: rowSection || section,
        status: rowStatus,
      });
    }
  }

  return { schoolYear, students, errors };
}
