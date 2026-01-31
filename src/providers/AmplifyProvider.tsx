"use client";

import { Amplify } from "aws-amplify";
import { ReactNode, useEffect, useState } from "react";

export function AmplifyProvider({ children }: { children: ReactNode }) {
  const [configured, setConfigured] = useState(false);

  useEffect(() => {
    async function configureAmplify() {
      try {
        // Try to fetch the amplify outputs at runtime
        const response = await fetch("/amplify_outputs.json");
        if (response.ok) {
          const outputs = await response.json();
          Amplify.configure(outputs, { ssr: true });
        } else {
          console.warn(
            "Amplify outputs not found. Run `npx ampx sandbox` to generate.",
          );
        }
      } catch (error) {
        console.warn("Amplify not configured:", error);
      } finally {
        setConfigured(true);
      }
    }
    configureAmplify();
  }, []);

  if (!configured) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse text-gray-500">Loading...</div>
      </div>
    );
  }

  return <>{children}</>;
}
