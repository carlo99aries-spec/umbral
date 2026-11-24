import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";
import { getCurrentUser } from "@/lib/auth";
import { LogoutButton } from "@/components/LogoutButton";
import { Avatar } from "@/components/Avatar";
import { ServiceWorker } from "@/components/ServiceWorker";

export const metadata: Metadata = {
  title: "Umbral — la red de la reputación",
  description:
    "Cada interacción termina en una calificación. Tu promedio ponderado decide a dónde puedes entrar. Proyecto open source inspirado en «Caída en picado».",
  applicationName: "Umbral",
  appleWebApp: { capable: true, title: "Umbral", statusBarStyle: "default" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#fdf1ec",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  maximumScale: 5,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen">
        <ServiceWorker />

        <header className="sticky top-0 z-50 bg-[#fdf1ec]/85 backdrop-blur-md">
          <nav className="mx-auto flex h-16 max-w-[560px] items-center justify-between px-4">
            <Link href="/" className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-2xl bg-gradient-to-br from-[#f7d3dd] to-[#d6e8f7] text-lg font-extrabold text-[#3b3550] shadow-[0_4px_12px_rgba(59,53,80,.12)]">
                U
              </span>
              <span className="text-lg font-extrabold tracking-tight text-[#3b3550]">umbral</span>
            </Link>

            <div className="flex items-center gap-1 text-sm">
              {user ? (
                <>
                  <Link
                    href="/settings"
                    className="rounded-full px-3 py-1.5 font-semibold text-[#6b6480] transition hover:bg-white/70 hover:text-[#3b3550]"
                  >
                    Ajustes
                  </Link>
                  <Link href={`/u/${user.handle}`} className="ml-1">
                    <Avatar name={user.displayName} hue={user.avatarHue} size={32} ring />
                  </Link>
                  <LogoutButton className="ml-2 rounded-full px-2 py-1 text-[#a49db8] hover:text-[#3b3550]" />
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="rounded-full px-3 py-1.5 font-semibold text-[#6b6480] transition hover:text-[#3b3550]"
                  >
                    Entrar
                  </Link>
                  <Link href="/signup" className="btn-primary px-4 py-2 text-sm">
                    Crear cuenta
                  </Link>
                </>
              )}
            </div>
          </nav>
        </header>

        <main className="mx-auto w-full max-w-[560px] px-4 pb-16 pt-4">{children}</main>

        <footer className="mx-auto max-w-[560px] px-4 pb-10">
          <p className="text-center text-[11px] leading-relaxed text-[#a49db8]">
            Umbral es software libre (AGPL-3.0) y una crítica, no un servicio de crédito social.{" "}
            <Link href="/about" className="underline underline-offset-2 hover:text-[#6b6480]">
              Por qué existe
            </Link>
          </p>
        </footer>
      </body>
    </html>
  );
}
