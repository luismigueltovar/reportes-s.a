import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Iniciar Sesión — RC-699 Digital",
  description: "Accede al panel administrativo de Reportes S.A",
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
