/**
 * SubscribeButton.tsx
 * 
 * Button zum Abonnieren/Deabonnieren einer Idee.
 * - Einreichende Person ist automatisch abonniert (nicht deabonnierbar)
 * - Andere können sich abonnieren/deabonnieren
 */

"use client";

import { useState, useTransition } from "react";
import { Bell, BellOff } from "lucide-react";
import { useAuth } from "./AuthProvider";
import { subscribeToIdea, unsubscribeFromIdea } from "@/app/actions/subscribeActions";

interface SubscribeButtonProps {
  ideaId: string;
  subscribers: string[];
  submittedBy: string;
  onSubscribe?: () => void;
}

export default function SubscribeButton({ 
  ideaId, 
  subscribers, 
  submittedBy,
  onSubscribe 
}: SubscribeButtonProps) {
  const { user, isAuthenticated } = useAuth();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  
  const isSubscribed = user ? subscribers.includes(user.name) : false;

  // Nicht angemeldet → kein Button
  if (!isAuthenticated || !user) {
    return null;
  }

  // Ist der User der Einreicher?
  const isSubmitter = user.name === submittedBy;

  const handleToggleSubscribe = () => {
    // Einreicher können sich nicht deabonnieren
    if (isSubmitter && isSubscribed) {
      return;
    }

    if (!user) return;

    startTransition(async () => {
      setError(null);
      
      const result = isSubscribed
        ? await unsubscribeFromIdea(ideaId, subscribers, user.name)
        : await subscribeToIdea(ideaId, subscribers, user.name);

      if (!result.success) {
        setError(result.error || "Fehler beim Speichern");
        console.error("Fehler beim Abonnieren:", result.error);
      } else {
        onSubscribe?.();
      }
    });
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleToggleSubscribe}
        disabled={isPending || (isSubmitter && isSubscribed)}
        className={`btn btn-sm gap-2 ${
          isSubscribed ? "btn-ghost" : "btn-outline"
        } ${isSubmitter && isSubscribed ? "btn-disabled" : ""}`}
      >
        {isPending ? (
          <span className="loading loading-spinner loading-xs"></span>
        ) : isSubscribed ? (
          <>
            <BellOff className="h-4 w-4" />
            {isSubmitter ? "Abonniert (Einreicher)" : "Deabonnieren"}
          </>
        ) : (
          <>
            <Bell className="h-4 w-4" />
            Abonnieren
          </>
        )}
      </button>
      {error && (
        <p className="text-xs text-error">{error}</p>
      )}
    </div>
  );
}
