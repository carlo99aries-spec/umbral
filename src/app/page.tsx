import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { loadFeed } from "@/lib/feed";
import { PostCard } from "@/components/PostCard";
import { createPostAction } from "@/lib/actions";

export default async function FeedPage() {
  const me = await getCurrentUser();
  const posts = await loadFeed(me?.id ?? null);

  return (
    <div className="space-y-4">
      {me ? (
        <section className="panel p-4">
          <form action={createPostAction} className="space-y-3">
            <textarea
              name="caption"
              rows={2}
              maxLength={280}
              placeholder="¿Qué estás viviendo hoy?"
              className="field resize-none"
            />
            <div className="flex items-center gap-2">
              <input
                name="imageUrl"
                type="url"
                placeholder="Enlace a una imagen (opcional)"
                className="field flex-1 text-xs"
              />
              <button type="submit" className="btn-primary shrink-0 px-5 py-2.5 text-sm">
                Publicar
              </button>
            </div>
          </form>
        </section>
      ) : (
        <section className="panel p-5 text-center">
          <h1 className="text-xl font-extrabold text-[#3b3550]">Todos te califican. Siempre.</h1>
          <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-[#6b6480]">
            Cada interacción termina en una calificación. Tu promedio ponderado decide a dónde
            puedes entrar.
          </p>
          <div className="mt-4 flex justify-center gap-2">
            <Link href="/signup" className="btn-primary px-5 py-2.5 text-sm">
              Crear cuenta
            </Link>
            <Link href="/about" className="btn-ghost px-5 py-2.5 text-sm">
              Por qué existe
            </Link>
          </div>
        </section>
      )}

      {posts.length === 0 ? (
        <section className="panel p-8 text-center">
          <p className="text-sm text-[#6b6480]">
            El feed está vacío. {me ? "Publica algo y empieza el experimento." : "Entra para publicar."}
          </p>
        </section>
      ) : (
        posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            canRate={Boolean(me) && me!.id !== post.author.id}
            isAuthor={Boolean(me) && me!.id === post.author.id}
          />
        ))
      )}
    </div>
  );
}
