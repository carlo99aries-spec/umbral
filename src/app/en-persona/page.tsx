import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { PersonFlow } from "@/components/PersonFlow";

export const metadata = { title: "Calificar en persona — Umbral" };

export default async function InPersonPage() {
  const me = await getCurrentUser();
  if (!me) redirect("/login");

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

  return <PersonFlow baseUrl={baseUrl} />;
}
