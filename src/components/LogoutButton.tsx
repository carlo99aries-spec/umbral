import { logoutAction } from "@/lib/actions";

export function LogoutButton({ className = "" }: { className?: string }) {
  return (
    <form action={logoutAction}>
      <button
        type="submit"
        className={`text-sm font-semibold text-[#a49db8] transition hover:text-[#3b3550] ${className}`}
      >
        Salir
      </button>
    </form>
  );
}
