/**
 * AuthProvider.tsx
 * 
 * Context Provider für Token-basierte Authentifizierung.
 * Der User gibt seinen Dataverse Bearer Token ein, der dann
 * als Cookie gespeichert wird für Server-seitigen Zugriff.
 */

"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { extractUserFromToken, isTokenExpired, getTokenTimeRemaining } from "@/lib/jwt";

// ============================================
// TYPES
// ============================================

/**
 * User-Informationen aus dem JWT-Token
 */
export interface AuthUser {
  id: string;      // Azure AD Object ID
  name: string;    // Anzeigename
  email: string;   // E-Mail-Adresse
}

interface AuthContextType {
  // Der angemeldete User (oder null)
  user: AuthUser | null;
  // Token setzen (Login)
  setToken: (token: string) => Promise<{ success: boolean; error?: string }>;
  // Token löschen (Logout)
  clearToken: () => Promise<void>;
  // Loading-State
  isLoading: boolean;
  // Ist User angemeldet?
  isAuthenticated: boolean;
  // Token-Status
  tokenTimeRemaining: string | null;
  // Modal für Token-Eingabe öffnen
  showTokenModal: boolean;
  setShowTokenModal: (show: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// LocalStorage Key für den Token (zusätzlich zum Cookie)
const TOKEN_STORAGE_KEY = "dataverse_token";

// ============================================
// PROVIDER COMPONENT
// ============================================

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tokenTimeRemaining, setTokenTimeRemaining] = useState<string | null>(null);
  const [showTokenModal, setShowTokenModal] = useState(false);

  /**
   * Token-Status vom Server prüfen
   */
  const checkAuthStatus = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/token");
      const data = await response.json();

      if (data.authenticated && data.user) {
        setUser(data.user);
        
        // Token-Zeit aus localStorage aktualisieren
        const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
        if (storedToken) {
          setTokenTimeRemaining(getTokenTimeRemaining(storedToken));
        }
      } else {
        setUser(null);
        setTokenTimeRemaining(null);
        
        // Wenn Token abgelaufen, localStorage auch löschen
        if (data.reason === "expired") {
          localStorage.removeItem(TOKEN_STORAGE_KEY);
        }
      }
    } catch (error) {
      console.error("Auth-Status konnte nicht geprüft werden:", error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Beim Laden: Auth-Status prüfen
  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  // Token-Zeit regelmässig aktualisieren
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
      if (storedToken) {
        if (isTokenExpired(storedToken)) {
          // Token abgelaufen - ausloggen
          clearToken();
        } else {
          setTokenTimeRemaining(getTokenTimeRemaining(storedToken));
        }
      }
    }, 60000); // Jede Minute prüfen

    return () => clearInterval(interval);
  }, [user]);

  /**
   * Token setzen (Login)
   */
  const setToken = async (token: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // "Bearer " Präfix entfernen falls vorhanden
      const cleanToken = token.trim().startsWith("Bearer ") 
        ? token.trim().slice(7) 
        : token.trim();

      // Zuerst lokal validieren
      const tokenUser = extractUserFromToken(cleanToken);
      if (!tokenUser) {
        return { success: false, error: "Token konnte nicht dekodiert werden. Bitte prüfe das Format." };
      }

      if (isTokenExpired(cleanToken)) {
        return { success: false, error: "Token ist abgelaufen. Bitte hole einen neuen Token." };
      }

      // An Server senden (setzt Cookie)
      const response = await fetch("/api/auth/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: cleanToken }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || "Fehler beim Speichern des Tokens" };
      }

      // Auch im localStorage speichern (für Client-seitige Nutzung)
      localStorage.setItem(TOKEN_STORAGE_KEY, cleanToken);

      // User setzen
      setUser(data.user);
      setTokenTimeRemaining(getTokenTimeRemaining(cleanToken));
      setShowTokenModal(false);

      return { success: true };
    } catch (error) {
      console.error("Fehler beim Setzen des Tokens:", error);
      return { success: false, error: "Ein unerwarteter Fehler ist aufgetreten" };
    }
  };

  /**
   * Token löschen (Logout)
   */
  const clearToken = async () => {
    try {
      // Cookie auf Server löschen
      await fetch("/api/auth/token", { method: "DELETE" });
      
      // LocalStorage löschen
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      
      // State zurücksetzen
      setUser(null);
      setTokenTimeRemaining(null);
    } catch (error) {
      console.error("Fehler beim Löschen des Tokens:", error);
    }
  };

  const value: AuthContextType = {
    user,
    setToken,
    clearToken,
    isLoading,
    isAuthenticated: user !== null,
    tokenTimeRemaining,
    showTokenModal,
    setShowTokenModal,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// ============================================
// HOOK
// ============================================

/**
 * Hook um auf den Auth-Context zuzugreifen.
 * Muss innerhalb von AuthProvider verwendet werden.
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth muss innerhalb von AuthProvider verwendet werden");
  }
  return context;
}

/**
 * Hilfsfunktion: Token aus localStorage holen (für Client Components)
 */
export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}
