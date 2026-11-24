import { redirect } from "next/navigation";
import { SignupForm } from "@/components/SignupForm";
import { getCurrentUser } from "@/lib/auth";

export const metadata = { title: "Crear cuenta — Umbral" };

export default async function SignupPage() {
  const user = await getCurrentUser();
  if (user) redirect(`/u/${user.handle}`);

  return (
    <div className="pt-4">
      <h1 className="text-2xl font-extrabold tracking-tight text-[#3b3550]">Entra al experimento</h1>
      <p className="mt-1 text-sm text-[#6b6480]">
        Empiezas en 3.5. Neutral. El resto lo decide la gente.
      </p>
      <div className="panel mt-5 p-6">
        <SignupForm />
      </div>
    </div>
  );
}
