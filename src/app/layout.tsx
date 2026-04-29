import type { Metadata } from "next";
import { Inter, Montserrat } from "next/font/google";
import "./globals.css";

// Fuente para el cuerpo del texto (clara y excelente para lectura de datos)
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

// Fuente para los títulos (moderna y profesional)
const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Laboratorio LEYMA",
  description: "Plataforma integral para el registro de pacientes, control de exámenes y resultados clínicos.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${inter.variable} ${montserrat.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans text-slate-800 bg-slate-50">
        {children}
      </body>
    </html>
  );
}