import { prisma } from "./db";
import { loadProfile } from "./profile";
import type { Tier } from "./reputation";

export interface FeedAuthor {
  id: string;
  handle: string;
  displayName: string;
  avatarHue: number;
  score: number;
  tier: Tier;
}

export interface FeedPost {
  id: string;
  caption: string;
  imageUrl: string | null;
  hue: number;
  createdAt: Date;
  author: FeedAuthor;
  /** Mean of the stars the post received. Content signal, not reputation. */
  avgStars: number | null;
  ratingCount: number;
  /** Stars this viewer already gave, if any. */
  myStars: number | null;
}

/**
 * Feed loader.
 *
 * Note the deliberate separation: a post's stars are content feedback. They do
 * NOT enter the author's reputation, which comes only from verified 1:1
 * interactions. One profile lookup per distinct author — cheap at this scale,
 * and the obvious thing to cache if the feed grows.
 */
export async function loadFeed(viewerId: string | null, take = 20): Promise<FeedPost[]> {
  const posts = await prisma.post.findMany({
    orderBy: { createdAt: "desc" },
    take,
    include: { author: true, ratings: true },
  });

  const authors = new Map<string, FeedAuthor>();

  for (const post of posts) {
    if (authors.has(post.authorId)) continue;

    const profile = await loadProfile(post.author.handle);

    authors.set(post.authorId, {
      id: post.authorId,
      handle: post.author.handle,
      displayName: post.author.displayName,
      avatarHue: post.author.avatarHue,
      score: profile?.score.score ?? 3.5,
      tier:
        profile?.tier ??
        ({
          name: "BRONZE",
          label: "Bronce",
        } as Tier),
    });
  }

  return posts.map((post) => {
    const count = post.ratings.length;
    const sum = post.ratings.reduce((acc, r) => acc + r.stars, 0);
    const mine = viewerId ? post.ratings.find((r) => r.raterId === viewerId) : undefined;

    return {
      id: post.id,
      caption: post.caption,
      imageUrl: post.imageUrl,
      hue: post.hue,
      createdAt: post.createdAt,
      author: authors.get(post.authorId)!,
      avgStars: count > 0 ? Math.round((sum / count) * 10) / 10 : null,
      ratingCount: count,
      myStars: mine?.stars ?? null,
    };
  });
}
