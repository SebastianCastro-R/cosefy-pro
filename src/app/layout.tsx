import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Cosefy Pro - Gestión de Taller',
  description: 'Sistema de gestión integral para talleres de arreglos',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
