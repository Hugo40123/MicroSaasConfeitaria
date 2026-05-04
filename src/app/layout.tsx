import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Confeitaria SaaS",
  description: "Gestao simples de pedidos, producao e cardapio online para confeitarias."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
