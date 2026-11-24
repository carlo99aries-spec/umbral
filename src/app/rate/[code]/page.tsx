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
    <div className="pt-2">
      <div className="panel p-6">
        <div className="flex items-center gap-3 border-b border-[#f3eef6] pb-4">
          <Avatar name={token.issuer.displayName} hue={token.issuer.avatarHue} size={48} ring />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-extrabold text-[#3b3550]">
              {token.issuer.displayName}
            </p>
            <p className="text-xs font-semibold text-[#a49db8]">@{token.issuer.handle}</p>
          </div>
          {tier && <TierBadge name={tier.name} label={tier.label} size="sm" />}
        </div>

        {token.note && (
          <p className="mt-4 rounded-2xl bg-[#faf7fb] px-3 py-2 text-xs font-semibold text-[#6b6480]">
            Contexto: {token.note}
          </p>
        )}

        <div className="mt-5">
          <RateForm code={code} targetName={token.issuer.displayName} />
        </div>
      </div>
    </div>
  );
}

function Frame({ title, body }: { title: string; body: string }) {
  return (
    <div className="pt-10 text-center">
      <h1 className="text-xl font-extrabold text-[#3b3550]">{title}</h1>
      <p className="mt-2 text-sm text-[#6b6480]">{body}</p>
      <Link href="/" className="btn-ghost mt-6 inline-block px-5 py-2.5 text-sm">
        Volver al feed
      </Link>
    </div>
  );
}
