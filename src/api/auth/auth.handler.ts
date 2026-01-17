import { APIError, Gateway } from "encore.dev/api";
import { authHandler } from "encore.dev/auth";
import { AuthData, AuthParams } from "./auth.interface";
import AuthService from "./auth.service";

const myAuthHandler = authHandler(
  async (params: AuthParams): Promise<AuthData> => {
    const token = params.authorization.replace("Bearer ", "");

    if (!token) {
      throw APIError.unauthenticated("No token provided");
    }

    const authenticatedUser = await AuthService.getAuthenticatedUser(token);

    return authenticatedUser;
  }
);

export const gateway = new Gateway({ authHandler: myAuthHandler });
