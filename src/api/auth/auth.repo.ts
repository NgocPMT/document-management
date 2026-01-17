import { eq } from "drizzle-orm";
import { db } from "../../db/database";
import { session, user } from "../../db/schema";

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
    const userRows = await db
      .select({
        id: user.id,
        email: user.email,
        name: user.name,
      })
      .from(user)
      .where(eq(user.id, id))
      .limit(1);

    return userRows[0];
  },
};

export default AuthRepository;
