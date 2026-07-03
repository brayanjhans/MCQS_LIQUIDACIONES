import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AppShell from "@/components/AppShell";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MCQS-JCQ | Sistema de Liquidaciones",
  description: "Sistema de Control y Liquidaciones de Consorcios",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${inter.className} bg-gray-50 dark:bg-slate-900 text-gray-800 dark:text-gray-100 antialiased transition-colors duration-300`}>
        <AppShell>
          {children}
        </AppShell>
      </body>
    </html>
  );
}
