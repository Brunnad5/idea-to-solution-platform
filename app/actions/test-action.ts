"use server";

/**
 * Test Server Action um zu prüfen ob Server Actions grundsätzlich funktionieren
 */
export async function testAction(): Promise<{ success: boolean; message: string }> {
  console.log("[TEST] Server Action wurde aufgerufen");
  return { success: true, message: "Server Action funktioniert!" };
}
