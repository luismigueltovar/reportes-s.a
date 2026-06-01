import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Iniciar Sesión — RC-699 Digital",
  description: "Accede al panel administrativo de HLGAS",
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
