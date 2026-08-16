import type { Metadata, Viewport } from "next";
import "./globals.css";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const metadata: Metadata = {
  title: "Presidio Web — local PII detection",
  description: "Detect and redact sensitive data entirely in your browser.",
  manifest: `${basePath}/manifest.webmanifest`,
};

export const viewport: Viewport = { themeColor: "#101713", colorScheme: "dark" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
