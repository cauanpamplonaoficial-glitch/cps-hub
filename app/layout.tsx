import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CPS Hub V2 | CPS STORE",
  description: "Central de gestão da CPS STORE — painel demonstrativo independente.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}