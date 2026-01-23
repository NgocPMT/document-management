import { SignInDTO } from "./auth.interface";
import { APIError } from "encore.dev/api";
import { auth } from "./auth.config";
import { SignUpDTO } from "./auth.schema";
import AuthRepository from "./auth.repo";
import log from "encore.dev/log";

const AuthService = {
  register: async ({ email, password, name }: SignUpDTO) => {
    log.info("AuthService.register: Attempting to register user", { email });
    const result = await auth.api.signUpEmail({
      body: {
        email,
        password,
        name,
      },
    });

    if (!result.user || !result.token) {
      log.warn("AuthService.register: Failed to create user");
      throw APIError.internal("Auth service failed to create user");
    }

    log.info("AuthService.register: User created successfully", {
      userId: result.user.id,
    });
    return result;
  },
  login: async ({ email, password }: SignInDTO) => {
    log.info("AuthService.login: Attempting to log in user", { email });
    const result = await auth.api.signInEmail({
      body: {
        email,
        password,
      },
    });

    if (!result.user || !result.token) {
      log.warn("AuthService.login: Invalid credentials", { email });
      throw APIError.unauthenticated("Invalid credentials");
    }
    log.info("AuthService.login: User logged in successfully", {
      userId: result.user.id,
    });
    return result;
  },
  getAuthenticatedUser: async (token: string) => {
    try {
      log.info("AuthService.getAuthenticatedUser: Validating token");
      const session = await AuthRepository.getSessionByToken(token);

      if (!session.userId) {
        log.warn("AuthService.getAuthenticatedUser: Invalid session");
        throw APIError.unauthenticated("Invalid session");
      }

      if (new Date(session.expiresAt) < new Date()) {
        log.warn("AuthService.getAuthenticatedUser: Expired session");
        throw APIError.unauthenticated("Expired session");
      }

      const user = await AuthRepository.getUser(session.userId);

      if (!user) {
        log.warn("AuthService.getAuthenticatedUser: User not found");
        throw APIError.unauthenticated("User not found");
      }

      log.info("AuthService.getAuthenticatedUser: User authenticated", {
        userId: user.id,
      });

      return {
        userID: user.id,
      };
    } catch (error) {
      log.error("AuthService.getAuthenticatedUser: Error validating token", {
        error,
      });
      throw APIError.unauthenticated("Invalid token", error as Error);
    }
  },
};

export default AuthService;
