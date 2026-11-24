import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { loadProfile } from "@/lib/profile";
import { Avatar } from "@/components/Avatar";
import { TierBadge } from "@/components/TierBadge";
import { RateForm } from "@/components/RateForm";

export const metadata = { title: "Calificar — Umbral" };

export default async function RatePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;

  const me = await getCurrentUser();
  if (!me) redirect(`/login?next=/rate/${code}`);

  const token = await prisma.interactionToken.findUnique({
    where: { code },
    include: { issuer: true },
  });

  if (!token) return <Frame title="Código inválido" body="Este código no existe. Pide uno nuevo." />;
  if (token.usedAt)
    return <Frame title="Código ya usado" body="Los códigos son de un solo uso. Pide otro." />;
  if (token.expiresAt.getTime() < Date.now())
    return <Frame title="Código expirado" body="Los códigos duran 24 horas. Pide uno nuevo." />;
  if (token.issuerId === me.id)
    return <Frame title="No puedes calificarte" body="Necesitas a otra persona para esto." />;

  const issuerProfile = await loadProfile(token.issuer.handle);
  const tier = issuerProfile?.tier;

  const recent = await prisma.rating.findFirst({
    where: {
      raterId: me.id,
      subjectId: token.issuerId,
      createdAt: { gte: new Date(Date.now() - 30 * 86_400_000) },
    },
  });

  if (recent) {
    return (
      <Frame
        title="Ya calificaste a esta persona"
        body="Solo puedes calificar a la misma persona una vez cada 30 días."
      />
    );
  }

  return (
    <div className="mx-auto max-w-md pt-4">
      <div className="panel rounded-2xl p-6">
        <div className="flex items-center gap-3 border-b border-zinc-900 pb-5">
          <Avatar name={token.issuer.displayName} hue={token.issuer.avatarHue} size={48} ring />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-zinc-100">
              {token.issuer.displayName}
            </p>
            <p className="text-xs text-zinc-500">@{token.issuer.handle}</p>
          </div>
          {tier && (
            <div className="ml-auto">
              <TierBadge name={tier.name} label={tier.label} size="sm" />
            </div>
          )}
        </div>

        {token.note && (
          <p className="mt-4 rounded-lg border border-zinc-900 bg-zinc-950/60 px-3 py-2 text-xs text-zinc-500">
            Contexto: {token.note}
          </p>
        )}

        <div className="mt-6">
          <RateForm code={code} targetName={token.issuer.displayName} />
        </div>
      </div>
    </div>
  );
}

function Frame({ title, body }: { title: string; body: string }) {
  return (
    <div className="mx-auto max-w-md pt-10 text-center">
      <h1 className="text-xl font-semibold text-zinc-100">{title}</h1>
      <p className="mt-2 text-sm text-zinc-500">{body}</p>
      <Link
        href="/"
        className="mt-6 inline-block rounded-lg border border-zinc-800 px-4 py-2 text-sm text-zinc-300 transition hover:border-zinc-600"
      >
        Volver al inicio
      </Link>
    </div>
  );
}
