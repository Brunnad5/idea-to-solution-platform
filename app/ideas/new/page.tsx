/**
 * app/ideas/new/page.tsx
 * 
 * Seite zum Einreichen einer neuen Idee.
 * Bindet das IdeaForm Client Component ein.
 */

import Link from "next/link";
import { ArrowLeft, Lightbulb } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import IdeaForm from "./IdeaForm";

export default function NewIdeaPage() {
  // Aktuellen User für Anzeige holen
  const currentUser = getCurrentUser();

  return (
    <div className="max-w-2xl mx-auto">
      {/* Zurück-Link */}
      <Link href="/ideas" className="btn btn-ghost btn-sm gap-2 mb-4">
        <ArrowLeft className="h-4 w-4" />
        Zurück zum Ideen-Pool
      </Link>

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-primary/10 p-3 rounded-full">
          <Lightbulb className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Neue Idee einreichen</h1>
          <p className="text-base-content/60">
            Eingereicht von: {currentUser.name}
          </p>
        </div>
      </div>

      {/* Formular-Card */}
      <div className="card bg-base-100 shadow-lg">
        <div className="card-body">
          <IdeaForm />
        </div>
      </div>

      {/* Hinweis */}
      <div className="mt-6 text-sm text-base-content/50 text-center">
        Nach dem Einreichen wird deine Idee vom Digital Solution Team geprüft.
        Du kannst den Status jederzeit im Ideen-Pool verfolgen.
      </div>
    </div>
  );
}
