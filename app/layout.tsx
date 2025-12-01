/**
 * layout.tsx
 * 
 * Das Root-Layout der App. Definiert die HTML-Struktur, Metadaten,
 * Schriftarten und bindet die Navbar ein, die auf allen Seiten sichtbar ist.
 */

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Providers from "@/components/Providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Metadaten für SEO und Browser-Tab
export const metadata: Metadata = {
  title: "Idea2Solution | Digitalisierungsideen einreichen",
  description:
    "Plattform zum Einreichen und Verfolgen von Digitalisierungsideen für interne Mitarbeitende.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Script das vor dem Rendern das Theme aus localStorage lädt (verhindert Flash)
  const themeScript = `
    (function() {
      const theme = localStorage.getItem('theme') || 'corporate';
      document.documentElement.setAttribute('data-theme', theme);
    })();
  `;

  return (
    <html lang="de" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-base-200`}
      >
        <Providers>
          {/* Navigation auf allen Seiten */}
          <Navbar />

          {/* Hauptinhalt der jeweiligen Seite */}
          <main className="container mx-auto px-4 py-6">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
