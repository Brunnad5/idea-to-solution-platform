/**
 * app/api/auth/token/route.ts
 * 
 * API-Route zum Setzen und Löschen des Dataverse-Tokens als Cookie.
 * Das Cookie ermöglicht Server-seitigen Zugriff auf den Token.
 */

import { NextRequest, NextResponse } from "next/server";
import { extractUserFromToken, isTokenExpired } from "@/lib/jwt";

// Cookie-Name für den Token
const TOKEN_COOKIE_NAME = "dataverse_token";

// Cookie-Optionen für Sicherheit
const COOKIE_OPTIONS = {
  httpOnly: true,        // Nicht per JavaScript zugreifbar (XSS-Schutz)
  secure: process.env.NODE_ENV === "production", // HTTPS in Produktion
  sameSite: "lax" as const,  // CSRF-Schutz
  path: "/",             // Für alle Pfade verfügbar
  maxAge: 60 * 60,       // 1 Stunde (wie Token-Lebensdauer)
};

/**
 * POST: Token setzen
 * Body: { token: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token || typeof token !== "string") {
      return NextResponse.json(
        { error: "Token fehlt oder ist ungültig" },
        { status: 400 }
      );
    }

    // Token validieren (dekodieren)
    const user = extractUserFromToken(token);
    if (!user) {
      return NextResponse.json(
        { error: "Token konnte nicht dekodiert werden. Bitte prüfe das Format." },
        { status: 400 }
      );
    }

    // Prüfen ob Token abgelaufen ist
    if (isTokenExpired(token)) {
      return NextResponse.json(
        { error: "Token ist abgelaufen. Bitte hole einen neuen Token." },
        { status: 400 }
      );
    }

    // Response mit Cookie erstellen
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });

    // Token als Cookie setzen
    response.cookies.set(TOKEN_COOKIE_NAME, token, COOKIE_OPTIONS);

    return response;
  } catch (error) {
    console.error("Fehler beim Setzen des Tokens:", error);
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 }
    );
  }
}

/**
 * DELETE: Token löschen (Logout)
 */
export async function DELETE() {
  const response = NextResponse.json({ success: true });
  
  // Cookie löschen
  response.cookies.set(TOKEN_COOKIE_NAME, "", {
    ...COOKIE_OPTIONS,
    maxAge: 0, // Sofort ablaufen lassen
  });

  return response;
}

/**
 * GET: Token-Status prüfen
 */
export async function GET(request: NextRequest) {
  const token = request.cookies.get(TOKEN_COOKIE_NAME)?.value;

  if (!token) {
    return NextResponse.json({ authenticated: false });
  }

  const user = extractUserFromToken(token);
  if (!user) {
    return NextResponse.json({ authenticated: false });
  }

  if (isTokenExpired(token)) {
    return NextResponse.json({ 
      authenticated: false, 
      reason: "expired" 
    });
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
  });
}
