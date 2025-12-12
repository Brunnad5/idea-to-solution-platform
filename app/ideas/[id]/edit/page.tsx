/**
 * app/ideas/[id]/edit/page.tsx
 * 
 * Seite zum Bearbeiten einer Idee.
 * Nur der Besitzer (Einreicher) kann seine Idee bearbeiten.
 */

import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { fetchIdeaById } from "@/lib/dataverse";
import { isIdeaOwner } from "@/lib/auth";
import { ArrowLeft, Edit } from "lucide-react";
import EditIdeaForm from "./EditIdeaForm";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditIdeaPage({ params }: PageProps) {
  const { id } = await params;

  // Idee laden
  const idea = await fetchIdeaById(id);

  // 404 wenn Idee nicht existiert
  if (!idea) {
    notFound();
  }

  // Prüfen ob aktueller User der Besitzer ist
  const canEdit = isIdeaOwner(idea.submittedBy);

  // Wenn nicht Besitzer, zur Detailseite zurück
  if (!canEdit) {
    redirect(`/ideas/${id}`);
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Zurück-Link */}
      <Link href={`/ideas/${id}`} className="btn btn-ghost btn-sm gap-2 mb-4">
        <ArrowLeft className="h-4 w-4" />
        Zurück zur Detailansicht
      </Link>

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-primary/10 p-3 rounded-full">
          <Edit className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Idee bearbeiten</h1>
          <p className="text-base-content/60">
            Du kannst nur die Beschreibung ändern
          </p>
        </div>
      </div>

      {/* Formular-Card */}
      <div className="card bg-base-100 shadow-lg">
        <div className="card-body">
          <EditIdeaForm
            ideaId={id}
            currentTitle={idea.title}
            currentDescription={idea.description}
            currentStatus={idea.status}
          />
        </div>
      </div>
    </div>
  );
}
