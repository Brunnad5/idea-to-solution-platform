/**
 * app/ideas/[id]/edit/EditIdeaForm.tsx
 * 
 * Client Component zum Bearbeiten der Beschreibung einer Idee.
 * Nur die Beschreibung ist editierbar, der Titel wird nur angezeigt.
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { editIdeaSchema, EditIdeaInput } from "@/lib/validators";
import { updateIdea } from "./actions";
import { AlertCircle, CheckCircle, Loader2, Save } from "lucide-react";

type EditIdeaFormProps = {
  ideaId: string;
  currentTitle: string;
  currentDescription: string;
  currentStatus?: string; // Für automatischen Status-Reset bei "in Überarbeitung"
};

export default function EditIdeaForm({
  ideaId,
  currentTitle,
  currentDescription,
  currentStatus,
}: EditIdeaFormProps) {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // React Hook Form mit Zod-Resolver
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<EditIdeaInput>({
    resolver: zodResolver(editIdeaSchema),
    defaultValues: {
      description: currentDescription,
    },
  });

  // Formular absenden
  const onSubmit = async (data: EditIdeaInput) => {
    setSubmitError(null);

    // Status übergeben für automatischen Reset bei "in Überarbeitung"
    const result = await updateIdea(ideaId, data, currentStatus);

    if (result.success) {
      setSubmitSuccess(true);
      // Nach kurzer Verzögerung zurück zur Detailseite
      setTimeout(() => {
        router.push(`/ideas/${ideaId}`);
        router.refresh(); // Cache invalidieren
      }, 1500);
    } else {
      setSubmitError(result.error || "Ein unbekannter Fehler ist aufgetreten.");
    }
  };

  // Erfolgsmeldung
  if (submitSuccess) {
    return (
      <div className="alert alert-success">
        <CheckCircle className="h-5 w-5" />
        <div>
          <h3 className="font-bold">Änderungen gespeichert!</h3>
          <p className="text-sm">Du wirst zur Detailansicht weitergeleitet...</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Fehlermeldung */}
      {submitError && (
        <div className="alert alert-error">
          <AlertCircle className="h-5 w-5" />
          <span>{submitError}</span>
        </div>
      )}

      {/* Titel (nur Anzeige, nicht editierbar) */}
      <div className="form-control">
        <label className="label">
          <span className="label-text font-medium">Titel</span>
        </label>
        <input
          type="text"
          value={currentTitle}
          disabled
          className="input input-bordered w-full bg-base-200 cursor-not-allowed"
        />
        <label className="label">
          <span className="label-text-alt text-base-content/60">
            Der Titel kann nicht geändert werden
          </span>
        </label>
      </div>

      {/* Beschreibung (editierbar) */}
      <div className="form-control">
        <label className="label" htmlFor="description">
          <span className="label-text font-medium">Beschreibung *</span>
        </label>
        <textarea
          id="description"
          placeholder="Beschreibe deine Idee..."
          className={`textarea textarea-bordered w-full h-40 ${
            errors.description ? "textarea-error" : ""
          }`}
          {...register("description")}
        />
        {errors.description && (
          <label className="label">
            <span className="label-text-alt text-error">
              {errors.description.message}
            </span>
          </label>
        )}
      </div>

      {/* Buttons */}
      <div className="flex justify-end gap-4">
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => router.back()}
        >
          Abbrechen
        </button>
        <button
          type="submit"
          className="btn btn-primary gap-2"
          disabled={isSubmitting || !isDirty}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Wird gespeichert...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Änderungen speichern
            </>
          )}
        </button>
      </div>

      {/* Hinweis wenn keine Änderungen */}
      {!isDirty && (
        <p className="text-sm text-base-content/50 text-center">
          Nimm Änderungen vor, um speichern zu können.
        </p>
      )}
    </form>
  );
}
