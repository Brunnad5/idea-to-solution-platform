/**
 * app/ideas/new/IdeaForm.tsx
 * 
 * Client Component für das Ideen-Einreichungsformular.
 * Verwendet React Hook Form für Formular-Handling und Zod für Validierung.
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createIdeaSchema, CreateIdeaInput } from "@/lib/validators";
import { submitIdea } from "./actions";
import { AlertCircle, CheckCircle, Loader2, Send } from "lucide-react";

export default function IdeaForm() {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // React Hook Form mit Zod-Resolver konfigurieren
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateIdeaInput>({
    resolver: zodResolver(createIdeaSchema),
    defaultValues: {
      title: "",
      description: "",
    },
  });

  // Formular absenden
  const onSubmit = async (data: CreateIdeaInput) => {
    setSubmitError(null);
    
    const result = await submitIdea(data);

    if (result.success) {
      setSubmitSuccess(true);
      // Nach kurzer Verzögerung zur Ideen-Liste navigieren
      setTimeout(() => {
        router.push("/ideas");
      }, 1500);
    } else {
      setSubmitError(result.error || "Ein unbekannter Fehler ist aufgetreten.");
    }
  };

  // Erfolgsmeldung anzeigen
  if (submitSuccess) {
    return (
      <div className="alert alert-success">
        <CheckCircle className="h-5 w-5" />
        <div>
          <h3 className="font-bold">Idee eingereicht!</h3>
          <p className="text-sm">Deine Idee wurde erfolgreich gespeichert. Du wirst weitergeleitet...</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Fehlermeldung vom Server */}
      {submitError && (
        <div className="alert alert-error">
          <AlertCircle className="h-5 w-5" />
          <span>{submitError}</span>
        </div>
      )}

      {/* Titel-Feld */}
      <div className="form-control">
        <label className="label" htmlFor="title">
          <span className="label-text font-medium">Titel der Idee *</span>
        </label>
        <input
          id="title"
          type="text"
          placeholder="z.B. Digitale Zeiterfassung per App"
          className={`input input-bordered w-full ${errors.title ? "input-error" : ""}`}
          {...register("title")}
        />
        {errors.title && (
          <label className="label">
            <span className="label-text-alt text-error">{errors.title.message}</span>
          </label>
        )}
        <label className="label">
          <span className="label-text-alt text-base-content/60">
            Ein kurzer, prägnanter Titel für deine Idee (5-200 Zeichen)
          </span>
        </label>
      </div>

      {/* Beschreibung-Feld */}
      <div className="form-control">
        <label className="label" htmlFor="description">
          <span className="label-text font-medium">Beschreibung *</span>
        </label>
        <textarea
          id="description"
          placeholder="Beschreibe deine Idee ausführlich: Was ist das Problem? Wie könnte die Lösung aussehen? Welchen Nutzen bringt es?"
          className={`textarea textarea-bordered w-full h-40 ${errors.description ? "textarea-error" : ""}`}
          {...register("description")}
        />
        {errors.description && (
          <label className="label">
            <span className="label-text-alt text-error">{errors.description.message}</span>
          </label>
        )}
        <label className="label">
          <span className="label-text-alt text-base-content/60">
            Je detaillierter die Beschreibung, desto besser kann die Idee bewertet werden (mind. 20 Zeichen)
          </span>
        </label>
      </div>

      {/* Submit-Button */}
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
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Wird eingereicht...
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              Idee einreichen
            </>
          )}
        </button>
      </div>
    </form>
  );
}
