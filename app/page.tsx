/**
 * page.tsx (Startseite)
 * 
 * Die Landing Page des Ideen-Portals der St. Galler Stadtwerke.
 * Zeigt eine kurze Einführung und Call-to-Action Buttons.
 */

import Link from "next/link";
import { Lightbulb, ListChecks, PlusCircle } from "lucide-react";

export default function Home() {
  return (
    <div className="hero min-h-[70vh]">
      <div className="hero-content text-center">
        <div className="max-w-2xl">
          {/* Hauptüberschrift */}
          <h1 className="text-4xl font-bold sm:text-5xl">
            Willkommen beim{" "}
            <span className="text-primary">Ideen-Portal</span>
          </h1>
          <p className="text-lg text-base-content/60 mt-2">
            der St. Galler Stadtwerke
          </p>

          {/* Beschreibung */}
          <p className="py-6 text-lg text-base-content/70">
            Hast du eine Idee, wie wir unsere Arbeit digitaler und effizienter
            gestalten können? Hier kannst du deine Digitalisierungsideen
            einreichen und den Fortschritt verfolgen.
          </p>

          {/* Call-to-Action Buttons */}
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Link href="/ideas/new" className="btn btn-primary gap-2">
              <PlusCircle className="h-5 w-5" />
              Neue Idee einreichen
            </Link>
            <Link href="/ideas" className="btn btn-outline gap-2">
              <ListChecks className="h-5 w-5" />
              Ideen-Pool ansehen
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
