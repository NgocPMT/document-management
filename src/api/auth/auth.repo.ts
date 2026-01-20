import { eq } from "drizzle-orm";
import { db } from "../../db/database";
import { session, user } from "../../db/schema";
import { cache } from "../cache/keyv";

const USER_TTL = 8 * 60_000; // 8 minutes

const AuthRepository = {
  getSessionByToken: async (token: string) => {
    const sessionRows = await db
      .select({
        userId: session.userId,
        expiresAt: session.expiresAt,
      })
      .from(session)
      .where(eq(session.token, token))
      .limit(1);

    return sessionRows[0];
  },
  getUser: async (id: string) => {
    const cacheKey = `auth:user:${id}`;
    const cached = await cache.get<{
      id: string;
      email: string;
      name: string;
    } | null>(cacheKey);
    if (cached !== undefined) return cached;

    const userRows = await db
      .select({
        id: user.id,
        email: user.email,
        name: user.name,
      })
      .from(user)
      .where(eq(user.id, id))
      .limit(1);

    const cacheValue = userRows[0] ?? null;
    await cache.set(cacheKey, cacheValue, USER_TTL);
    return userRows[0];
  },
};

export default AuthRepository;
