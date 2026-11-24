import { logoutAction } from "@/lib/actions";

export function LogoutButton({ className = "" }: { className?: string }) {
  return (
    <form action={logoutAction}>
      <button
        type="submit"
        className={`text-sm text-zinc-500 transition hover:text-zinc-200 ${className}`}
      >
        Salir
      </button>
    </form>
  );
}
