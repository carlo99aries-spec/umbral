import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

/** Tab "Perfil" of the bottom nav: your own profile, or the login. */
export default async function MyProfileTab() {
  const me = await getCurrentUser();
  if (!me) redirect("/login");
  redirect(`/u/${me.handle}`);
}
