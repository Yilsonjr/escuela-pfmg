// Manual de Usuario — Escuela Primaria Prof. Felipe Montes Gómez
// Genera: Manual_Usuario_Portal_Escolar.docx

const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, HeadingLevel, BorderStyle,
  WidthType, ShadingType, VerticalAlign, PageNumber, PageBreak,
  LevelFormat, TableOfContents, ExternalHyperlink,
} = require("docx");
const fs = require("fs");

/* ── Colores institucionales ────────────────────────────────── */
const NAVY   = "092e66";
const GOLD   = "c47f00"; // oscurecido para texto
const SILVER = "F1F5FA";
const GRAY   = "64748B";
const WHITE  = "FFFFFF";
const GREEN  = "16A34A";
const RED    = "DC2626";
const BORDER_COLOR = "CBD5E1";

/* ── Helpers ────────────────────────────────────────────────── */
const border = (color = BORDER_COLOR) => ({
  style: BorderStyle.SINGLE, size: 1, color,
});
const cellBorders = (color = BORDER_COLOR) => ({
  top: border(color), bottom: border(color),
  left: border(color), right: border(color),
});
const noBorders = () => ({
  top:    { style: BorderStyle.NONE },
  bottom: { style: BorderStyle.NONE },
  left:   { style: BorderStyle.NONE },
  right:  { style: BorderStyle.NONE },
});

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 120 },
    children: [new TextRun({ text, bold: true, size: 32, color: NAVY, font: "Arial" })],
  });
}
function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 80 },
    children: [new TextRun({ text, bold: true, size: 26, color: NAVY, font: "Arial" })],
  });
}
function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 200, after: 60 },
    children: [new TextRun({ text, bold: true, size: 22, color: GRAY, font: "Arial" })],
  });
}
function p(text, opts = {}) {
  return new Paragraph({
    spacing: { after: 120 },
    children: [new TextRun({ text, size: 22, font: "Arial", color: "374151", ...opts })],
  });
}
function pBold(text) {
  return p(text, { bold: true });
}
function pageBreak() {
  return new Paragraph({ children: [new PageBreak()] });
}
function divider() {
  return new Paragraph({
    spacing: { before: 120, after: 120 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: BORDER_COLOR } },
    children: [],
  });
}
function space(after = 120) {
  return new Paragraph({ spacing: { after }, children: [] });
}

/* Bullet item */
function bullet(text, bold = false) {
  return new Paragraph({
    numbering: { reference: "bullets", level: 0 },
    spacing: { after: 80 },
    children: [new TextRun({ text, size: 22, font: "Arial", color: "374151", bold })],
  });
}
function numbered(text) {
  return new Paragraph({
    numbering: { reference: "numbers", level: 0 },
    spacing: { after: 80 },
    children: [new TextRun({ text, size: 22, font: "Arial", color: "374151" })],
  });
}

/* Nota / aviso */
function note(text, type = "info") {
  const bgMap   = { info: "EFF6FF", warn: "FFFBEB", tip: "F0FDF4", danger: "FEF2F2" };
  const clrMap  = { info: "1E40AF", warn: "92400E", tip: "166534", danger: "991B1B" };
  const lblMap  = { info: "NOTA",   warn: "IMPORTANTE", tip: "CONSEJO", danger: "ADVERTENCIA" };
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [9360],
    rows: [new TableRow({ children: [new TableCell({
      width: { size: 9360, type: WidthType.DXA },
      borders: { top: { style: BorderStyle.SINGLE, size: 8, color: clrMap[type] },
                 bottom: border(BORDER_COLOR), left: border(BORDER_COLOR), right: border(BORDER_COLOR) },
      shading: { fill: bgMap[type], type: ShadingType.CLEAR },
      margins: { top: 120, bottom: 120, left: 160, right: 160 },
      children: [new Paragraph({ spacing: { after: 60 }, children: [
        new TextRun({ text: lblMap[type] + ": ", bold: true, size: 20, color: clrMap[type], font: "Arial" }),
        new TextRun({ text, size: 20, color: clrMap[type], font: "Arial" }),
      ]})]
    })]})]
  });
}

/* Tabla de 2 columnas */
function twoColTable(rows, headerRow = null) {
  const makeHeaderRow = () => new TableRow({
    tableHeader: true,
    children: headerRow.map((h, i) => new TableCell({
      width: { size: i === 0 ? 3000 : 6360, type: WidthType.DXA },
      borders: cellBorders(NAVY),
      shading: { fill: NAVY, type: ShadingType.CLEAR },
      margins: { top: 80, bottom: 80, left: 120, right: 120 },
      children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, size: 20, color: WHITE, font: "Arial" })] })],
    })),
  });

  const makeRow = (cols, shade = false) => new TableRow({
    children: cols.map((c, i) => new TableCell({
      width: { size: i === 0 ? 3000 : 6360, type: WidthType.DXA },
      borders: cellBorders(),
      shading: { fill: shade ? "F8FAFC" : WHITE, type: ShadingType.CLEAR },
      margins: { top: 80, bottom: 80, left: 120, right: 120 },
      children: [new Paragraph({ children: [new TextRun({ text: c, size: 20, font: "Arial", color: "374151" })] })],
    })),
  });

  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [3000, 6360],
    rows: [
      ...(headerRow ? [makeHeaderRow()] : []),
      ...rows.map((r, i) => makeRow(r, i % 2 === 0)),
    ],
  });
}

/* ── PORTADA ────────────────────────────────────────────────── */
function coverPage() {
  return [
    space(2000),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      children: [new TextRun({ text: "ESCUELA PRIMARIA", size: 28, font: "Arial", color: NAVY, bold: true })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [new TextRun({ text: "PROF. FELIPE MONTES GÓMEZ", size: 36, font: "Arial", color: NAVY, bold: true })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      border: { top: { style: BorderStyle.SINGLE, size: 8, color: GOLD } },
      spacing: { before: 200, after: 200 },
      children: [],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      children: [new TextRun({ text: "MANUAL DE USUARIO", size: 44, font: "Arial", color: NAVY, bold: true })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
      children: [new TextRun({ text: "Portal Administrativo Escolar", size: 28, font: "Arial", color: GRAY, italics: true })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: GOLD } },
      spacing: { before: 400, after: 200 },
      children: [],
    }),
    space(800),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      children: [new TextRun({ text: "República Dominicana", size: 22, font: "Arial", color: GRAY })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      children: [new TextRun({ text: "Versión 1.0  —  2026", size: 22, font: "Arial", color: GRAY })],
    }),
    pageBreak(),
  ];
}

/* ── SECCIONES DEL MANUAL ───────────────────────────────────── */

function secIntroduccion() {
  return [
    h1("1. Introducción"),
    p("El Portal Administrativo de la Escuela Primaria Prof. Felipe Montes Gómez es una plataforma digital institucional diseñada para centralizar y simplificar la gestión escolar. Permite a directivos, docentes y personal administrativo gestionar estudiantes, registrar asistencia, generar alertas, administrar documentos y consultar métricas — todo desde un solo lugar, con acceso seguro desde cualquier dispositivo."),
    space(),
    h2("1.1 Acceso a la plataforma"),
    p("La plataforma está disponible en línea las 24 horas. Puede acceder desde cualquier navegador moderno (Chrome, Firefox, Edge, Safari) en computadoras, tabletas o telefófonos."),
    space(),
    twoColTable([
      ["URL del portal",    "https://escuela-pfmg.netlify.app"],
      ["Panel administrativo", "https://escuela-pfmg.netlify.app/admin"],
      ["Soporte técnico",  "Contactar a la Dirección del plantel"],
    ], ["Recurso", "Dirección / Información"]),
    space(),
    h2("1.2 Requisitos técnicos"),
    bullet("Navegador web actualizado (Chrome 100+, Firefox 100+, Edge 100+)"),
    bullet("Conexión a internet estable"),
    bullet("Correo electrónico institucional activo"),
    bullet("Contraseña asignada por la Dirección"),
    space(),
    note("Esta plataforma es de uso exclusivo del personal autorizado de la institución. El acceso no autorizado está prohibido.", "warn"),
    pageBreak(),
  ];
}

function secAcceso() {
  return [
    h1("2. Acceso al Sistema"),
    h2("2.1 Iniciar sesión"),
    p("Para entrar al panel administrativo:"),
    numbered("Abra su navegador y visite la URL del portal."),
    numbered("Haga clic en el botón “Acceso Institucional” o vaya directamente a /admin."),
    numbered("Ingrese su correo electrónico institucional y su contraseña."),
    numbered("Presione “Iniciar Sesión”."),
    space(),
    note("Si su cuenta fue creada recientemente, use la contraseña temporal provista por la Dirección y cámbiela inmediatamente desde su perfil.", "warn"),
    space(),
    h2("2.2 Cerrar sesión"),
    p("Para cerrar sesión de forma segura, haga clic en el botón “Salir” que se encuentra al final del menú lateral izquierdo. Siempre cierre sesión al terminar, especialmente en computadoras compartidas."),
    space(),
    h2("2.3 Cambiar contraseña"),
    p("Puede cambiar su contraseña en cualquier momento desde el módulo de Perfil:"),
    numbered("Haga clic en su nombre en la parte superior del menú lateral."),
    numbered("Se abrirá la página “Mi Perfil”."),
    numbered("Llene el formulario: contraseña actual, nueva contraseña y confirmación."),
    numbered("Haga clic en “Cambiar contraseña”."),
    space(),
    note("La contraseña debe tener mínimo 8 caracteres. Recomendamos combinar letras, números y símbolos.", "tip"),
    space(),
    h2("2.4 Si olvidó su contraseña"),
    p("Contacte al administrador del sistema (Director/a) para que restablezca su contraseña desde el módulo de Gestión de Usuarios."),
    pageBreak(),
  ];
}

function secNavegacion() {
  return [
    h1("3. Navegación General"),
    h2("3.1 Menú lateral (Sidebar)"),
    p("El menú lateral está disponible en el lado izquierdo de la pantalla en computadoras, o accesible mediante el botón flotante en dispositivos móviles. Desde él puede acceder a todos los módulos habilitados para su rol."),
    space(),
    twoColTable([
      ["Dashboard",       "Resumen general de la institución con estadísticas clave"],
      ["Personal",        "Gestión de docentes y personal administrativo"],
      ["Alumnado",        "Registro y seguimiento de estudiantes"],
      ["Asistencia",      "Registro diario de asistencia por sección"],
      ["Alertas",         "Alertas automáticas por ausencias y rendimiento"],
      ["Documentos",      "Generación de certificaciones y constancias"],
      ["Métricas",        "Estadísticas y análisis de rendimiento"],
      ["APMAE",           "Gestión de la asociación de padres"],
      ["Usuarios",        "Administración de cuentas del portal (solo Dirección)"],
      ["Configuración",   "Parámetros generales del sistema (solo Dirección)"],
    ], ["Módulo", "Descripción"]),
    space(),
    h2("3.2 Encabezado de módulo"),
    p("Cada módulo muestra en su parte superior un encabezado con el nombre del módulo, una descripción breve y, en algunos casos, botones de acción (agregar, exportar, etc.)."),
    space(),
    h2("3.3 Filtros y búsqueda"),
    p("La mayoría de los módulos incluyen una barra de búsqueda por texto y filtros por categoría. Utilice estos controles para localizar registros rápidamente."),
    pageBreak(),
  ];
}

function secDashboard() {
  return [
    h1("4. Dashboard"),
    p("El Dashboard es la pantalla de inicio del panel administrativo. Muestra un resumen en tiempo real del estado de la institución."),
    space(),
    h2("4.1 Tarjetas de resumen"),
    p("En la parte superior encontrará tarjetas con los indicadores más importantes:"),
    bullet("Total de estudiantes matriculados activos"),
    bullet("Total de personal docente y administrativo"),
    bullet("Secciones activas en el año escolar vigente"),
    bullet("Tasa de asistencia del día actual"),
    space(),
    h2("4.2 Alertas recientes"),
    p("El dashboard muestra las últimas alertas generadas por el sistema (estudiantes con ausencias frecuentes u otras situaciones de atención), permitiendo acceder rápidamente al módulo de Alertas."),
    space(),
    note("Los datos del Dashboard se actualizan automáticamente al recargar la página.", "info"),
    pageBreak(),
  ];
}

function secPersonal() {
  return [
    h1("5. Módulo de Personal"),
    p("Permite gestionar toda la información del personal que labora en la institución: docentes, administrativos, psicólogos y personal de apoyo."),
    space(),
    h2("5.1 Ver el listado de personal"),
    p("Al ingresar al módulo verá la lista completa del personal activo. Puede filtrar por categoría utilizando los botones: Todos, Docente, Administrativo, Psicología, Apoyo."),
    space(),
    h2("5.2 Agregar un nuevo miembro"),
    numbered("Haga clic en el botón “Nuevo Personal”."),
    numbered("Complete el formulario: nombre, apellido, cédula, cargo, correo, teléfono y departamento."),
    numbered("Seleccione el tipo de personal."),
    numbered("Haga clic en “Guardar”."),
    space(),
    h2("5.3 Editar un registro"),
    p("Haga clic en el botón de edición (lápiz) junto al nombre del empleado. Modifique los campos necesarios y guarde los cambios."),
    space(),
    h2("5.4 Desactivar personal"),
    p("En lugar de eliminar registros, el sistema permite marcar al personal como “inactivo”. Esto preserva el historial sin afectar los reportes actuales."),
    pageBreak(),
  ];
}

function secAlumnado() {
  return [
    h1("6. Módulo de Alumnado"),
    p("Centraliza la información de todos los estudiantes: datos personales, matrícula, grado, sección y estado."),
    space(),
    h2("6.1 Buscar un estudiante"),
    p("Use la barra de búsqueda para localizar a un estudiante por nombre, apellido o número de matrícula. También puede filtrar por grado o sección."),
    space(),
    h2("6.2 Registrar un nuevo estudiante"),
    numbered("Haga clic en “Nuevo Estudiante”."),
    numbered("Ingrese los datos personales: nombre, apellidos, fecha de nacimiento, documento de identidad."),
    numbered("Agregue datos del tutor o encargado legal."),
    numbered("Asigne el grado y sección correspondiente."),
    numbered("Haga clic en “Guardar”."),
    space(),
    h2("6.3 Matrícula"),
    p("La matrícula vincula al estudiante con un año escolar, un grado y una sección. Un estudiante puede tener matrículas en distintos años escolares, preservando su historial completo."),
    space(),
    h2("6.4 Ver historial de un estudiante"),
    p("Haga clic en el nombre del estudiante para ver su ficha completa: datos personales, historial de matrículas, asistencia y alertas previas."),
    pageBreak(),
  ];
}

function secAsistencia() {
  return [
    h1("7. Módulo de Asistencia"),
    p("Permite registrar y consultar la asistencia diaria de los estudiantes, organizados por sección."),
    space(),
    h2("7.1 Registrar asistencia del día"),
    numbered("Seleccione la sección en los botones superiores."),
    numbered("Navegue a la fecha deseada con las flechas o haga clic en “Ir a hoy”."),
    numbered("Para cada estudiante, seleccione el estado: Presente, Ausente o Tarde."),
    numbered("Haga clic en “Guardar asistencia”."),
    space(),
    note("El sistema guarda el último estado registrado. Puede corregir la asistencia de cualquier día pasado.", "tip"),
    space(),
    h2("7.2 Indicadores de riesgo"),
    p("La columna “Riesgo semanal” muestra una etiqueta de alerta si el estudiante acumula ausencias en la semana:"),
    space(),
    twoColTable([
      ["1 ausencia",        "Sin etiqueta (normal)"],
      ["2 ausencias",       "Etiqueta amarilla “Atención”"],
      ["3 o más ausencias",  "Etiqueta roja “Riesgo alto”"],
    ], ["Condición", "Indicador"]),
    space(),
    h2("7.3 Permisos de edición"),
    p("Solo los usuarios con permiso “asistencia:manage” pueden registrar o modificar la asistencia. Los demás pueden consultarla en modo lectura."),
    pageBreak(),
  ];
}

function secAlertas() {
  return [
    h1("8. Módulo de Alertas"),
    p("Genera alertas automáticas para identificar estudiantes que requieren atención especial por ausencias frecuentes u otras situaciones de riesgo."),
    space(),
    h2("8.1 Tipos de alertas"),
    twoColTable([
      ["Ausentismo crítico",  "Estudiante con 3 o más ausencias en la semana"],
      ["Ausentismo moderado", "Estudiante con 2 ausencias en la semana"],
      ["Sin registrar",       "Sección sin asistencia registrada en el día"],
    ], ["Tipo", "Descripción"]),
    space(),
    h2("8.2 Tomar acción sobre una alerta"),
    p("Cada alerta muestra el nombre del estudiante, la sección, el número de ausencias y un enlace directo a su registro de asistencia para verificar o corregir."),
    space(),
    note("Las alertas se recalculan en cada carga de página. No requieren configuración adicional.", "info"),
    pageBreak(),
  ];
}

function secDocumentos() {
  return [
    h1("9. Módulo de Documentos"),
    p("Permite generar certificaciones y constancias oficiales para los estudiantes de la institución."),
    space(),
    h2("9.1 Tipos de documentos disponibles"),
    bullet("Constancia de estudios"),
    bullet("Certificación de matrícula"),
    bullet("Certificación de promoción"),
    bullet("Otros documentos oficiales"),
    space(),
    h2("9.2 Generar un documento"),
    numbered("Busque al estudiante por nombre o matrícula."),
    numbered("Seleccione el tipo de documento que desea generar."),
    numbered("Verifique que los datos del estudiante sean correctos."),
    numbered("Haga clic en “Generar”. El documento se creará en formato PDF."),
    numbered("Descargue o imprima el documento generado."),
    space(),
    note("Los documentos generados tienen fecha automática y datos del año escolar activo. Verifique que el año escolar esté correctamente configurado antes de generar documentos.", "warn"),
    pageBreak(),
  ];
}

function secMetricas() {
  return [
    h1("10. Módulo de Métricas"),
    p("Presenta estadísticas y gráficas del rendimiento general de la institución para apoyar la toma de decisiones."),
    space(),
    h2("10.1 Indicadores disponibles"),
    bullet("Tasa de asistencia general y por grado"),
    bullet("Distribución de estudiantes por grado y sección"),
    bullet("Evolución mensual de asistencia"),
    bullet("Comparativa entre secciones"),
    bullet("Alertas acumuladas por período"),
    space(),
    h2("10.2 Interpretar las gráficas"),
    p("Las gráficas se actualizan con los datos reales del año escolar activo. Use los filtros de período para consultar diferentes meses o trimestres."),
    space(),
    note("Las métricas son de solo lectura. No se pueden modificar datos desde este módulo.", "info"),
    pageBreak(),
  ];
}

function secApmae() {
  return [
    h1("11. Módulo APMAE"),
    p("Gestiona la información de la Asociación de Padres, Madres y Amigos de la Escuela (APMAE), incluyendo miembros, cuotas y actividades."),
    space(),
    h2("11.1 Registrar un miembro de la APMAE"),
    numbered("Haga clic en “Nuevo Miembro”."),
    numbered("Ingrese nombre, apellido, correo, teléfono y relación con la institución."),
    numbered("Guarde el registro."),
    space(),
    h2("11.2 Registro de cuotas"),
    p("El módulo permite registrar los pagos de cuotas de asociación y llevar control de los miembros al día."),
    space(),
    h2("11.3 Actividades"),
    p("Puede registrar las actividades y reuniones de la APMAE para mantener un historial institucional."),
    pageBreak(),
  ];
}

function secUsuarios() {
  return [
    h1("12. Módulo de Usuarios (Solo Dirección)"),
    p("Permite administrar las cuentas de acceso al portal. Solo los usuarios con rol de Dirección (Super Admin) tienen acceso a este módulo."),
    space(),
    h2("12.1 Crear una nueva cuenta"),
    numbered("Haga clic en “Nuevo Usuario”."),
    numbered("Complete nombre completo, correo electrónico institucional y contraseña temporal (mínimo 8 caracteres)."),
    numbered("Seleccione el rol apropiado."),
    numbered("Opcionalmente, vincule la cuenta con un empleado del módulo de Personal."),
    numbered("Haga clic en “Crear Usuario”."),
    space(),
    note("Comunique la contraseña temporal al usuario de forma segura y pidále que la cambie al primer inicio de sesión.", "warn"),
    space(),
    h2("12.2 Roles disponibles"),
    twoColTable([
      ["super_admin",   "Acceso total al sistema, incluyendo usuarios y configuración"],
      ["director",      "Acceso completo a todos los módulos excepto gestión de usuarios"],
      ["docente",       "Acceso a asistencia, alumnado y módulos de consulta"],
      ["administrativo","Acceso a documentos, alumnado y módulos administrativos"],
      ["psicologia",    "Acceso a alertas, alumnado y módulos de seguimiento"],
      ["apoyo",         "Acceso limitado de solo lectura a módulos asignados"],
    ], ["Rol", "Permisos"]),
    space(),
    h2("12.3 Otras acciones"),
    bullet("Editar rol: cambiar el rol de un usuario existente"),
    bullet("Restablecer contraseña: generar nueva contraseña temporal"),
    bullet("Activar/Desactivar: bloquear el acceso sin eliminar la cuenta"),
    bullet("Eliminar: borrar permanentemente una cuenta (irreversible)"),
    space(),
    note("La eliminación de cuentas es permanente e irreversible. Prefiera desactivar la cuenta si existe alguna duda.", "danger"),
    pageBreak(),
  ];
}

function secConfiguracion() {
  return [
    h1("13. Módulo de Configuración (Solo Dirección)"),
    p("Permite configurar los parámetros base del sistema: año escolar, grados, secciones y módulos habilitados."),
    space(),
    h2("13.1 Año escolar"),
    p("El sistema opera con un año escolar activo a la vez. Desde Configuración puede:"),
    bullet("Ver todos los años escolares registrados"),
    bullet("Crear un nuevo año escolar"),
    bullet("Activar un año escolar como el vigente"),
    space(),
    note("Solo puede haber un año escolar activo a la vez. Activar uno nuevo desactiva el anterior automáticamente.", "warn"),
    space(),
    h2("13.2 Grados y secciones"),
    p("Puede agregar, editar o reorganizar los grados y sus secciones. Los cambios se reflejan en todos los módulos que utilizan esta información."),
    space(),
    h2("13.3 Módulos habilitados"),
    p("El administrador puede activar o desactivar módulos del menú lateral para simplificar la interfaz de usuarios que no necesitan ciertos módulos."),
    pageBreak(),
  ];
}

function secPerfil() {
  return [
    h1("14. Perfil de Usuario"),
    p("Cada usuario puede acceder a su perfil haciendo clic en su nombre en la parte superior del menú lateral."),
    space(),
    h2("14.1 Información mostrada"),
    bullet("Nombre completo"),
    bullet("Correo electrónico institucional"),
    bullet("Rol asignado"),
    bullet("Estado de la cuenta (Activo/Inactivo)"),
    space(),
    h2("14.2 Cambiar contraseña"),
    p("Desde el perfil puede cambiar su contraseña de acceso:"),
    numbered("Ingrese su contraseña actual para verificar su identidad."),
    numbered("Ingrese la nueva contraseña (mínimo 8 caracteres)."),
    numbered("Confírmela en el tercer campo."),
    numbered("Haga clic en “Cambiar contraseña”."),
    space(),
    note("Si no recuerda su contraseña actual, solicite a la Dirección que la restablezca desde el módulo de Usuarios.", "tip"),
    pageBreak(),
  ];
}

function secSeguridad() {
  return [
    h1("15. Seguridad y Buenas Prácticas"),
    h2("15.1 Recomendaciones de seguridad"),
    bullet("Nunca comparta su contraseña con ningún compañero ni por ningún medio."),
    bullet("Cierre siempre la sesión al terminar de usar el portal."),
    bullet("No use el portal en redes Wi-Fi públicas sin VPN."),
    bullet("Cambie su contraseña periódicamente (cada 3-6 meses)."),
    bullet("Reporte inmediatamente accesos sospechosos a la Dirección."),
    space(),
    h2("15.2 Política de contraseñas"),
    twoColTable([
      ["Longitud mínima",    "8 caracteres"],
      ["Caracteres recomendados", "Letras mayúsculas, minúsculas, números y símbolos"],
      ["Caducidad sugerida",  "Cada 90 días"],
      ["Contraseñas prohibidas", "Nombre propio, fecha de nacimiento, secuencias simples (12345678)"],
    ], ["Parámetro", "Valor"]),
    space(),
    h2("15.3 Permisos y roles"),
    p("Cada usuario solo tiene acceso a los módulos y acciones autorizados para su rol. Si necesita acceso adicional, solicite a la Dirección que actualice su rol."),
    pageBreak(),
  ];
}

function secFAQ() {
  return [
    h1("16. Preguntas Frecuentes"),
    space(),
    pBold("P: No puedo iniciar sesión. ¿Qué hago?"),
    p("Verifique que su correo y contraseña sean correctos. Si el problema persiste, contacte a la Dirección para que restablezca su contraseña o verifique el estado de su cuenta."),
    divider(),
    pBold("P: Registré mal la asistencia de un estudiante. ¿Puedo corregirla?"),
    p("Sí. Navegue al módulo de Asistencia, seleccione la sección y la fecha correcta, cambie el estado del estudiante y guarde nuevamente."),
    divider(),
    pBold("P: ¿Cómo solicito la creación de una nueva cuenta?"),
    p("Solicite a la Dirección que cree su cuenta desde el módulo de Usuarios. Le enviarán un correo con sus credenciales temporales."),
    divider(),
    pBold("P: El sistema muestra un error. ¿Qué hago?"),
    p("Recargue la página. Si el error persiste, anote el mensaje que aparece en pantalla y repórtelo a la Dirección o al soporte técnico."),
    divider(),
    pBold("P: ¿Puedo usar el portal desde mi teléfono?"),
    p("Sí. El portal es completamente responsivo y funciona en smartphones y tabletas. Use el botón flotante para abrir el menú de navegación en dispositivos móviles."),
    divider(),
    pBold("P: ¿Los datos se guardan en tiempo real?"),
    p("Sí. Cada acción (guardar, editar, registrar) se almacena inmediatamente en la base de datos. No es necesario guardar manualmente al salir."),
    divider(),
    pBold("P: ¿Puedo ver los registros de otros años escolares?"),
    p("Sí. Aunque solo un año escolar está activo, el historial de los años anteriores se conserva y puede consultarse desde los módulos correspondientes."),
    pageBreak(),
  ];
}

function secGlosario() {
  return [
    h1("17. Glosario"),
    twoColTable([
      ["Año escolar activo", "El período escolar vigente configurado en el sistema"],
      ["Matrícula",          "Inscripción de un estudiante en un grado y sección para el año activo"],
      ["Sección",            "Subdivisión de un grado (ej. 3° A, 3° B)"],
      ["APMAE",              "Asociación de Padres, Madres y Amigos de la Escuela"],
      ["MINERD",             "Ministerio de Educación de la República Dominicana"],
      ["Rol",                "Conjunto de permisos asignado a un usuario del portal"],
      ["Super Admin",        "Usuario con acceso total al sistema incluyendo configuración"],
      ["PDF",                "Formato de documento portable utilizado para certificaciones"],
      ["Tanda extendida",    "Horario escolar ampliado hasta las 5:00 PM"],
    ], ["Término", "Definición"]),
  ];
}

/* ── CONSTRUIR DOCUMENTO ─────────────────────────────────────── */
async function main() {
  const doc = new Document({
    numbering: {
      config: [
        {
          reference: "bullets",
          levels: [{
            level: 0, format: LevelFormat.BULLET, text: "•",
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } },
          }],
        },
        {
          reference: "numbers",
          levels: [{
            level: 0, format: LevelFormat.DECIMAL, text: "%1.",
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } },
          }],
        },
      ],
    },
    styles: {
      default: {
        document: { run: { font: "Arial", size: 22 } },
      },
      paragraphStyles: [
        {
          id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { size: 32, bold: true, font: "Arial", color: NAVY },
          paragraph: { spacing: { before: 360, after: 120 }, outlineLevel: 0 },
        },
        {
          id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { size: 26, bold: true, font: "Arial", color: NAVY },
          paragraph: { spacing: { before: 280, after: 80 }, outlineLevel: 1 },
        },
        {
          id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { size: 22, bold: true, font: "Arial", color: GRAY },
          paragraph: { spacing: { before: 200, after: 60 }, outlineLevel: 2 },
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: 12240, height: 15840 },
            margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: BORDER_COLOR } },
                spacing: { after: 120 },
                children: [
                  new TextRun({ text: "Manual de Usuario — Portal Escolar PFMG", size: 18, color: GRAY, font: "Arial" }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                border: { top: { style: BorderStyle.SINGLE, size: 4, color: BORDER_COLOR } },
                spacing: { before: 80 },
                children: [
                  new TextRun({ text: "Escuela Primaria Prof. Felipe Montes Gómez  —  Pág. ", size: 18, color: GRAY, font: "Arial" }),
                  new TextRun({ children: [PageNumber.CURRENT], size: 18, color: GRAY, font: "Arial" }),
                ],
              }),
            ],
          }),
        },
        children: [
          // Portada
          ...coverPage(),

          // Tabla de contenidos
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            children: [new TextRun({ text: "Índice de Contenidos", bold: true, size: 32, color: NAVY, font: "Arial" })],
          }),
          new TableOfContents("Índice", { hyperlink: true, headingStyleRange: "1-2" }),
          pageBreak(),

          // Secciones
          ...secIntroduccion(),
          ...secAcceso(),
          ...secNavegacion(),
          ...secDashboard(),
          ...secPersonal(),
          ...secAlumnado(),
          ...secAsistencia(),
          ...secAlertas(),
          ...secDocumentos(),
          ...secMetricas(),
          ...secApmae(),
          ...secUsuarios(),
          ...secConfiguracion(),
          ...secPerfil(),
          ...secSeguridad(),
          ...secFAQ(),
          ...secGlosario(),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  const outPath = "Manual_Usuario_Portal_Escolar.docx";
  fs.writeFileSync(outPath, buffer);
  console.log(`Documento creado: ${outPath} (${(buffer.length / 1024).toFixed(1)} KB)`);
}

main().catch(console.error);
