import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";
import { getCurrentUser } from "@/lib/auth";
import { LogoutButton } from "@/components/LogoutButton";
import { Avatar } from "@/components/Avatar";
import { ServiceWorker } from "@/components/ServiceWorker";

export const metadata: Metadata = {
  title: "Umbral — la red social de la reputación",
  description:
    "Cada interacción termina en una calificación. Tu promedio ponderado decide a dónde puedes entrar. Proyecto open source inspirado en «Caída en picado».",
  applicationName: "Umbral",
  appleWebApp: {
    capable: true,
    title: "Umbral",
    statusBarStyle: "black-translucent",
  },
  formatDetection: { telephone: false },
  openGraph: {
    title: "Umbral — red de reputación",
    description: "Todos te califican. Siempre.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#08080b",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  maximumScale: 5,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  return (
    <html lang="es">
      <body className="min-h-screen text-zinc-200">
        <ServiceWorker />
        <header className="sticky top-0 z-50 border-b border-zinc-900/80 bg-[#08080b]/85 backdrop-blur-md">
          <nav className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
            <Link href="/" className="group flex items-center gap-2">
              <span className="grid h-7 w-7 place-items-center rounded-md bg-gradient-to-br from-indigo-400 to-fuchsia-500 text-sm font-black text-white">
                U
              </span>
              <span className="text-[15px] font-semibold tracking-tight text-zinc-100">umbral</span>
              <span className="hidden rounded-full border border-zinc-800 px-2 py-0.5 text-[9px] uppercase tracking-widest text-zinc-500 sm:inline">
                alpha
              </span>
            </Link>

            <div className="flex items-center gap-4 text-sm">
              {user ? (
                <>
                  <Link
                    href={`/u/${user.handle}`}
                    className="flex items-center gap-2 text-zinc-400 transition hover:text-zinc-100"
                  >
                    <Avatar name={user.displayName} hue={user.avatarHue} size={26} />
                    <span className="hidden sm:inline">@{user.handle}</span>
                  </Link>
                  <Link href="/settings" className="text-zinc-500 transition hover:text-zinc-200">
                    Ajustes
                  </Link>
                  <LogoutButton />
                </>
              ) : (
                <>
                  <Link href="/login" className="text-zinc-400 transition hover:text-zinc-100">
                    Entrar
                  </Link>
                  <Link
                    href="/signup"
                    className="rounded-lg bg-white px-3.5 py-1.5 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-200"
                  >
                    Crear cuenta
                  </Link>
                </>
              )}
            </div>
          </nav>
        </header>

        <main className="mx-auto w-full max-w-5xl px-4 py-10">{children}</main>

        <footer className="mx-auto max-w-5xl px-4 pb-12 pt-6">
          <div className="flex flex-col gap-2 border-t border-zinc-900 pt-6 text-xs text-zinc-600 sm:flex-row sm:items-center sm:justify-between">
            <p>
              Umbral es software libre (AGPL-3.0) y una crítica, no un servicio de crédito social.
            </p>
            <a
              href="https://github.com/carlo99aries-spec/umbral"
              className="text-zinc-500 underline underline-offset-4 transition hover:text-zinc-300"
              target="_blank"
              rel="noreferrer"
            >
              github.com/carlo99aries-spec/umbral
            </a>
          </div>
        </footer>
      </body>
    </html>
  );
}
