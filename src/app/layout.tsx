import type { ReactNode } from "react";

export const metadata = { title: "genai-lab-ts" };

// No next/font/google or other network-backed feature: unit and E2E runs must work offline.
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
