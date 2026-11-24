import Link from "next/link";
import { Avatar } from "./Avatar";
import { ratePostAction } from "@/lib/actions";
import { timeAgo } from "@/lib/format";
import type { FeedPost } from "@/lib/feed";

/**
 * A feed card: author + their reputation, the image, the caption, and five
 * stars. The stars are content feedback — they never enter the author's
 * reputation number shown in the pill.
 */
export function PostCard({ post, canRate }: { post: FeedPost; canRate: boolean }) {
  const mine = post.myStars ?? 0;

  return (
    <article className="panel overflow-hidden">
      <div className="flex items-center gap-3 px-4 pt-4">
        <Link href={`/u/${post.author.handle}`} className="shrink-0">
          <Avatar name={post.author.displayName} hue={post.author.avatarHue} size={42} />
        </Link>

        <div className="min-w-0 flex-1">
          <Link
            href={`/u/${post.author.handle}`}
            className="block truncate text-[15px] font-extrabold text-[#3b3550] hover:underline"
          >
            {post.author.displayName}
          </Link>
          <p className="truncate text-xs font-semibold text-[#a49db8]">
            @{post.author.handle} · {timeAgo(post.createdAt)}
          </p>
        </div>

        <Link
          href={`/u/${post.author.handle}`}
          className="pill shrink-0 bg-[#fbe3a6] px-2.5 py-1 text-xs font-extrabold text-[#7a5715]"
          title="Reputación por interacciones verificadas"
        >
          {post.author.score.toFixed(1)} ★
        </Link>
      </div>

      <div className="px-4 pt-3">
        <div
          className="grid place-items-center overflow-hidden rounded-[20px]"
          style={{
            height: 232,
            background: `linear-gradient(135deg, hsl(${post.hue} 70% 88%), hsl(${(post.hue + 50) % 360} 62% 82%))`,
          }}
        >
          {post.imageUrl ? (
            // Remote images are user-supplied; keep them plain and contained.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.imageUrl}
              alt=""
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <span className="text-5xl opacity-30" aria-hidden="true">
              ✿
            </span>
          )}
        </div>
      </div>

      {post.caption && (
        <p className="px-4 pt-3 text-[14px] leading-relaxed text-[#3b3550]">{post.caption}</p>
      )}

      <div className="flex items-center justify-between px-3 pb-3 pt-2">
        {canRate ? (
          <form action={ratePostAction} className="flex items-center">
            <input type="hidden" name="postId" value={post.id} />
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="submit"
                name="stars"
                value={n}
                aria-label={`${n} estrella${n === 1 ? "" : "s"}`}
                className={`rounded-full px-1.5 text-2xl leading-none transition hover:scale-110 ${
                  mine >= n ? "text-[#f2b84b]" : "text-[#e6e1ee] hover:text-[#f7d9a0]"
                }`}
              >
                ★
              </button>
            ))}
          </form>
        ) : (
          <Link href="/login" className="px-2 text-xs font-semibold text-[#a49db8] hover:text-[#3b3550]">
            Entra para calificar
          </Link>
        )}

        <span className="pr-1 text-xs font-semibold text-[#a49db8]">
          {post.avgStars !== null ? `${post.avgStars.toFixed(1)} · ${post.ratingCount}` : "sin votos"}
        </span>
      </div>
    </article>
  );
}
