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
  subscriber?: string; // Aktueller Abonnent (Name)
  subscriberId?: string; // Aktueller Abonnent (GUID)
  ideengeberId?: string; // GUID des Ideengebers (für Prüfung)
  ideengeberName?: string; // Name des Ideengebers
  onSubscribe?: () => void;
}

export default function SubscribeButton({ 
  ideaId, 
  subscriber,
  subscriberId,
  ideengeberId,
  ideengeberName,
  onSubscribe 
}: SubscribeButtonProps) {
  const { user, isAuthenticated } = useAuth();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [isIdeengeberMessage, setIsIdeengeberMessage] = useState(false);
  
  // User ist abonniert wenn sein Name mit dem Abonnenten übereinstimmt
  const isSubscribed = user ? subscriber === user.name : false;

  // Nicht angemeldet → kein Button
  if (!isAuthenticated || !user) {
    return null;
  }

  // Ist der User der Ideengeber? (Name-basierte Prüfung für UI)
  const isIdeengeber = ideengeberName ? user.name === ideengeberName : false;

  const handleToggleSubscribe = () => {
    // Ideengeber können sich nicht abonnieren
    if (isIdeengeber) {
      setError("Abonnieren nicht notwendig. Als Ideengeber bist du automatisch für Updates abonniert.");
      setIsIdeengeberMessage(true);
      return;
    }

    if (!user) return;

    startTransition(async () => {
      setError(null);
      setIsIdeengeberMessage(false);
      
      const result = isSubscribed
        ? await unsubscribeFromIdea(ideaId)
        : await subscribeToIdea(ideaId, ideengeberId);

      if (!result.success) {
        setError(result.error || "Fehler beim Speichern");
        // Prüfen ob es die Ideengeber-Meldung ist
        if ('isIdeengeber' in result && result.isIdeengeber) {
          setIsIdeengeberMessage(true);
        }
        console.error("Fehler beim Abonnieren:", result.error);
      } else {
        onSubscribe?.();
      }
    });
  };

  // Ideengeber: Zeige Info-Meldung statt Button
  if (isIdeengeber) {
    return (
      <div className="alert alert-info text-sm py-2" suppressHydrationWarning>
        <Bell className="h-4 w-4" />
        <span>Abonnieren nicht notwendig. Als Ideengeber bist du automatisch für Updates abonniert.</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1" suppressHydrationWarning>
      <button
        onClick={handleToggleSubscribe}
        disabled={isPending}
        className={`btn btn-sm gap-2 ${
          isSubscribed ? "btn-ghost" : "btn-outline"
        }`}
        suppressHydrationWarning
      >
        {isPending ? (
          <span className="loading loading-spinner loading-xs"></span>
        ) : isSubscribed ? (
          <>
            <BellOff className="h-4 w-4" />
            Deabonnieren
          </>
        ) : (
          <>
            <Bell className="h-4 w-4" />
            Abonnieren
          </>
        )}
      </button>
      {error && (
        <p className={`text-xs ${isIdeengeberMessage ? "text-info" : "text-error"}`}>{error}</p>
      )}
    </div>
  );
}
