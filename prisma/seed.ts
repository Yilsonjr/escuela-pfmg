import { StaffType } from "@prisma/client";
import { prisma } from "../lib/prisma";
import bcrypt from "bcryptjs";

type RoleSeed = {
  key: string;
  name: string;
  permissions: { key: string; name: string }[];
};

const roleSeeds: RoleSeed[] = [
  {
    key: "DIRECTORA",
    name: "Directora",
    permissions: [
      { key: "center:manage", name: "Gestionar centro (todo)" },
      { key: "staff:manage", name: "Gestionar personal" },
      { key: "students:manage", name: "Gestionar alumnado" },
      { key: "attendance:manage", name: "Gestionar asistencia" },
      { key: "documents:manage", name: "Gestionar documentos" },
      { key: "meetings:manage", name: "Gestionar reuniones APMAE" },
      { key: "metrics:manage", name: "Gestionar métricas" },
      { key: "alerts:manage", name: "Gestionar alertas" },
    ],
  },
  {
    key: "ADMINISTRATIVO",
    name: "Administrativo",
    permissions: [
      { key: "staff:read", name: "Ver personal" },
      { key: "students:manage", name: "Gestionar alumnado" },
      { key: "attendance:manage", name: "Gestionar asistencia" },
      { key: "documents:manage", name: "Gestionar documentos" },
      { key: "meetings:read", name: "Ver reuniones APMAE" },
      { key: "metrics:read", name: "Ver métricas" },
      { key: "alerts:read", name: "Ver alertas" },
    ],
  },
  {
    key: "DOCENTE",
    name: "Docente",
    permissions: [
      { key: "students:read:scoped", name: "Ver alumnado (solo sus secciones)" },
      { key: "attendance:manage:scoped", name: "Asistencia (solo sus secciones)" },
      { key: "documents:read", name: "Ver documentos" },
      { key: "meetings:read", name: "Ver reuniones APMAE" },
    ],
  },
  {
    key: "PSICOLOGIA",
    name: "Psicología",
    permissions: [
      { key: "students:read", name: "Ver alumnado" },
      { key: "alerts:manage", name: "Gestionar alertas" },
      { key: "documents:read", name: "Ver documentos" },
      { key: "meetings:read", name: "Ver reuniones APMAE" },
    ],
  },
  {
    key: "APOYO",
    name: "Personal de apoyo",
    permissions: [{ key: "documents:read", name: "Ver documentos" }],
  },
];

async function main() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const schoolYearLabel = `${currentYear}-${currentYear + 1}`;

  const schoolYear = await prisma.schoolYear.upsert({
    where: { label: schoolYearLabel },
    update: { isActive: true },
    create: {
      label: schoolYearLabel,
      startsAt: new Date(currentYear, 7, 15),
      endsAt: new Date(currentYear + 1, 6, 15),
      isActive: true,
    },
  });

  const gradeSeeds = [
    { code: "PREPRIMARIO" as const, name: "Pre-primario", order: 1 },
    { code: "KINDER" as const, name: "Kinder", order: 2 },
    { code: "PRIMERO" as const, name: "1ero", order: 3 },
    { code: "SEGUNDO" as const, name: "2do", order: 4 },
    { code: "TERCERO" as const, name: "3ero", order: 5 },
  ];

  for (const g of gradeSeeds) {
    const grade = await prisma.grade.upsert({
      where: { code: g.code },
      update: { name: g.name, order: g.order },
      create: g,
    });

    const letters = ["A", "B", "C", "D"] as const;
    for (const letter of letters) {
      await prisma.section.upsert({
        where: { gradeId_letter: { gradeId: grade.id, letter } },
        update: { name: `${g.name} ${letter}` },
        create: { gradeId: grade.id, letter, name: `${g.name} ${letter}` },
      });
    }
  }

  for (const r of roleSeeds) {
    const role = await prisma.role.upsert({
      where: { key: r.key },
      update: { name: r.name },
      create: { key: r.key, name: r.name },
    });

    for (const p of r.permissions) {
      const perm = await prisma.permission.upsert({
        where: { key: p.key },
        update: { name: p.name },
        create: { key: p.key, name: p.name },
      });

      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId: perm.id } },
        update: {},
        create: { roleId: role.id, permissionId: perm.id },
      });
    }
  }

  const directorStaff = await prisma.staff.upsert({
    where: { email: "direccion@escuela.local" },
    update: { firstName: "Vianney", lastName: "Guzmán", type: StaffType.ADMINISTRATIVO },
    create: {
      firstName: "Vianney",
      lastName: "Guzmán",
      type: StaffType.ADMINISTRATIVO,
      email: "direccion@escuela.local",
      notes: "Dirección del centro",
    },
  });

  await prisma.staff.upsert({
    where: { email: "psicologia1@escuela.local" },
    update: { firstName: "Ingris", lastName: "Polanco", type: StaffType.PSICOLOGIA },
    create: {
      firstName: "Ingris",
      lastName: "Polanco",
      type: StaffType.PSICOLOGIA,
      email: "psicologia1@escuela.local",
    },
  });

  await prisma.staff.upsert({
    where: { email: "psicologia2@escuela.local" },
    update: { firstName: "Estefany", lastName: "Tejada", type: StaffType.PSICOLOGIA },
    create: {
      firstName: "Estefany",
      lastName: "Tejada",
      type: StaffType.PSICOLOGIA,
      email: "psicologia2@escuela.local",
    },
  });

  const seedEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@escuela.local";
  const seedPassword = process.env.SEED_ADMIN_PASSWORD ?? "admin1234";

  const passwordHash = await bcrypt.hash(seedPassword, 12);

  const user = await prisma.user.upsert({
    where: { email: seedEmail },
    update: { name: "Directora", passwordHash, staffId: directorStaff.id, isActive: true },
    create: {
      email: seedEmail,
      name: "Directora",
      passwordHash,
      staffId: directorStaff.id,
      isActive: true,
    },
  });

  const directoraRole = await prisma.role.findUnique({ where: { key: "DIRECTORA" } });
  if (directoraRole) {
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: user.id, roleId: directoraRole.id } },
      update: {},
      create: { userId: user.id, roleId: directoraRole.id },
    });
  }

  await prisma.schoolYear.update({
    where: { id: schoolYear.id },
    data: { isActive: true },
  });

  console.log(`Seed listo. Usuario inicial: ${seedEmail} (cambia la contraseña luego).`);
}

main()
  .catch(async (e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

