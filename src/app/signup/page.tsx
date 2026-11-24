import { redirect } from "next/navigation";
import { SignupForm } from "@/components/SignupForm";
import { getCurrentUser } from "@/lib/auth";

export const metadata = { title: "Crear cuenta — Umbral" };

export default async function SignupPage() {
  const user = await getCurrentUser();
  if (user) redirect(`/u/${user.handle}`);

  return (
    <div className="mx-auto max-w-sm pt-6">
      <h1 className="text-2xl font-bold tracking-tight text-white">Entra al experimento</h1>
      <p className="mt-2 text-sm text-zinc-500">
        Empiezas en 3.50. Neutral. El resto lo decide la gente.
      </p>
      <div className="panel mt-6 rounded-2xl p-6">
        <SignupForm />
      </div>
    </div>
  );
}
