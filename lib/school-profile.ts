import { prisma } from "@/lib/prisma";
import { siteConfig } from "@/lib/site-config";

export type SchoolProfileData = {
  name: string;
  shortName: string;
  subtitle: string;
  location: string;
  phone: string;
  email: string;
  foundedYear: number;
  approvalRate: string;
};

/** Obtiene el perfil del centro desde la BD, con fallback a siteConfig */
export async function getSchoolProfile(): Promise<SchoolProfileData> {
  try {
    const profile = await prisma.schoolProfile.findUnique({
      where: { id: "singleton" },
    });
    if (profile) return profile;
  } catch {
    // BD no disponible — usar valores estáticos
  }
  return {
    name:         siteConfig.name,
    shortName:    siteConfig.shortName,
    subtitle:     siteConfig.subtitle,
    location:     siteConfig.location,
    phone:        siteConfig.phone,
    email:        siteConfig.email,
    foundedYear:  siteConfig.foundedYear,
    approvalRate: siteConfig.stats.approvalRate,
  };
}
