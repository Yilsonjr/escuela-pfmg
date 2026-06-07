import type { Metadata } from "next";
import { Geist, Geist_Mono, Playfair_Display, Fraunces } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["400", "600", "700", "800", "900"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["300", "400", "600", "700", "900"],
});

export const metadata: Metadata = {
  title: {
    default: "Escuela Primaria Prof. Felipe Montes Gómez",
    template: "%s | Escuela Prof. Felipe Montes Gómez",
  },
  description:
    "Portal informativo y sistema administrativo de la Escuela Primaria Prof. Felipe Montes Gómez, República Dominicana.",
  keywords: ["escuela primaria", "Felipe Montes Gómez", "República Dominicana", "educación", "MINERD"],
  authors: [{ name: "Escuela Primaria Prof. Felipe Montes Gómez" }],
  robots: {
    index: true,
    follow: true,
    nocache: false,
  },
  openGraph: {
    title: "Escuela Primaria Prof. Felipe Montes Gómez",
    description: "Portal informativo y sistema administrativo de la Escuela Primaria Prof. Felipe Montes Gómez.",
    locale: "es_DO",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} ${fraunces.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
