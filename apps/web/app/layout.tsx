import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Autonomous Record Label",
  description: "AI-powered SaaS platform for autonomous music management."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
