import { redirect } from "next/navigation";
import { LoginForm } from "@/components/LoginForm";
import { getCurrentUser } from "@/lib/auth";

export const metadata = { title: "Entrar — Umbral" };

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect(`/u/${user.handle}`);

  return (
    <div className="mx-auto max-w-sm pt-6">
      <h1 className="text-2xl font-bold tracking-tight text-white">Tu número te espera</h1>
      <p className="mt-2 text-sm text-zinc-500">Entra y mira cómo te tienen calificado.</p>
      <div className="panel mt-6 rounded-2xl p-6">
        <LoginForm />
      </div>
    </div>
  );
}
