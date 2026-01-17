import { SignInDTO } from "./auth.interface";
import { APIError } from "encore.dev/api";
import { auth } from "./auth.config";
import { SignUpDTO } from "./auth.schema";
import AuthRepository from "./auth.repo";

const AuthService = {
  register: async ({ email, password, name }: SignUpDTO) => {
    const result = await auth.api.signUpEmail({
      body: {
        email,
        password,
        name,
      },
    });

    if (!result.user || !result.token) {
      throw APIError.internal("Auth service failed to create user");
    }
    return result;
  },
  login: async ({ email, password }: SignInDTO) => {
    const result = await auth.api.signInEmail({
      body: {
        email,
        password,
      },
    });

    if (!result.user || !result.token) {
      throw APIError.unauthenticated("Invalid credentials");
    }
    return result;
  },
  getAuthenticatedUser: async (token: string) => {
    try {
      const session = await AuthRepository.getSessionByToken(token);

      if (!session.userId) {
        throw APIError.unauthenticated("Invalid session");
      }

      if (new Date(session.expiresAt) < new Date()) {
        throw APIError.unauthenticated("Expired session");
      }

      const user = await AuthRepository.getUser(session.userId);

      if (!user) {
        throw APIError.unauthenticated("User not found");
      }

      return {
        userID: user.id,
        email: user.email,
        name: user.name,
      };
    } catch (error) {
      throw APIError.unauthenticated("Invalid token", error as Error);
    }
  },
};

export default AuthService;
