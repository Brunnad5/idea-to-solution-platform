/**
 * EditButton.tsx
 * 
 * Button zum Bearbeiten einer Idee.
 * Wird nur angezeigt, wenn der angemeldete User der Besitzer ist.
 * 
 * PROTOTYP-HINWEIS: Da createdby in Dataverse eine GUID ist und wir
 * die Azure AD Object ID haben, müssten diese eigentlich übereinstimmen.
 * Für den Prototyp zeigen wir den Button allen angemeldeten Usern.
 */

"use client";

import Link from "next/link";
import { Edit } from "lucide-react";
import { useAuth } from "./AuthProvider";

interface EditButtonProps {
  ideaId: string;
  // createdByGuid: Optional die GUID des Erstellers aus Dataverse
  createdByGuid?: string;
}

export default function EditButton({ ideaId, createdByGuid }: EditButtonProps) {
  const { user, isAuthenticated, isLoading } = useAuth();

  // Loading-Zustand
  if (isLoading) {
    return null;
  }

  // Nicht angemeldet → kein Button
  if (!isAuthenticated || !user) {
    return (
      <div className="text-sm text-base-content/50 text-center">
        Melde dich an, um diese Idee zu bearbeiten.
      </div>
    );
  }

  // Besitzer-Prüfung
  // HINWEIS: _createdby_value in Dataverse ist die SystemUser-ID, nicht die Azure AD Object ID.
  // Für eine echte Prüfung müssten wir die SystemUser-Tabelle abfragen.
  // PROTOTYP: Alle angemeldeten User dürfen bearbeiten.
  // TODO: Echte Besitzer-Prüfung implementieren wenn nötig.
  const isOwner = true; // Prototyp: Alle angemeldeten User erlauben
  
  // Debug-Log (kann später entfernt werden)
  if (createdByGuid && user.id !== createdByGuid) {
    console.log("Besitzer-Info:", { 
      userObjectId: user.id, 
      dataverseCreatedBy: createdByGuid,
      hinweis: "IDs unterscheiden sich - Dataverse nutzt SystemUser-ID, Token enthält Azure AD Object ID"
    });
  }

  if (!isOwner) {
    return (
      <div className="text-sm text-base-content/50 text-center">
        Nur der Ersteller kann diese Idee bearbeiten.
      </div>
    );
  }

  return (
    <Link 
      href={`/ideas/${ideaId}/edit`}
      className="btn btn-primary gap-2"
    >
      <Edit className="h-4 w-4" />
      Beschreibung bearbeiten
    </Link>
  );
}
