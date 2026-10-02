import type { Metadata } from "next";
import { Archivo, Gelasio } from "next/font/google";
import "./globals.css";

// Archivo's width axis gives the condensed caps printed on tabs.
const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  axes: ["wdth"],
});

// Metric-compatible with Georgia, the face many emailed agreements print in.
const gelasio = Gelasio({
  variable: "--font-gelasio",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Redline",
  description:
    "Paste a document before you accept it. Redline flags the clauses that could hurt you and shows the exact sentence each one came from.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${archivo.variable} ${gelasio.variable} antialiased`}>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
