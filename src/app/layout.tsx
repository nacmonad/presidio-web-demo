import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Presidio Web — local PII detection",
  description: "Detect and redact sensitive data entirely in your browser.",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = { themeColor: "#101713", colorScheme: "dark" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
