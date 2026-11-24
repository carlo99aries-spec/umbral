import { redirect } from "next/navigation";
import { LoginForm } from "@/components/LoginForm";
import { getCurrentUser } from "@/lib/auth";

export const metadata = { title: "Entrar — Umbral" };

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect(`/u/${user.handle}`);

  return (
    <div className="pt-4">
      <h1 className="text-2xl font-extrabold tracking-tight text-[#3b3550]">Tu número te espera</h1>
      <p className="mt-1 text-sm text-[#6b6480]">Entra y mira cómo te tienen calificado.</p>
      <div className="panel mt-5 p-6">
        <LoginForm />
      </div>
    </div>
  );
}
