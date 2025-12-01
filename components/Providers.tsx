/**
 * Providers.tsx
 * 
 * Client Component Wrapper für alle Context Provider.
 * Wird im Root-Layout verwendet, um Provider-Komponenten einzubinden.
 */

"use client";

import { ReactNode } from "react";
import { AuthProvider } from "./AuthProvider";
import TokenModal from "./TokenModal";

interface ProvidersProps {
  children: ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <AuthProvider>
      {children}
      {/* Token-Modal global verfügbar */}
      <TokenModal />
    </AuthProvider>
  );
}
