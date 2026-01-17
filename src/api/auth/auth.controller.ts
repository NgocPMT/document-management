import { api, APIError } from "encore.dev/api";
import { SignInSchema, SignUpSchema } from "./auth.schema";
import { SignInDTO, SignUpDTO } from "./auth.interface";
import AuthService from "./auth.service";

interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
  };
  session: {
    token: string;
    expiredAt: Date;
  };
}

export const signUp = api(
  { path: "/v1/auth/register", method: "POST", expose: true },
  async (req: SignUpDTO): Promise<AuthResponse> => {
    const parsedResult = SignUpSchema.safeParse(req);

    if (!parsedResult.success) {
      throw APIError.invalidArgument(
        `Invalid request: \n${parsedResult.error.issues}`
      );
    }

    const { email, password, confirmPassword, name } = parsedResult.data;

    const { user, token } = await AuthService.register({
      email,
      password,
      confirmPassword,
      name,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      session: {
        token: token,
        expiredAt: new Date(Date.now() + 60 * 60 * 24 * 7 * 1000), // 7 days from now
      },
    };
  }
);

export const signIn = api(
  { path: "/v1/auth/login", method: "POST", expose: true },
  async (req: SignInDTO): Promise<AuthResponse> => {
    const parsedResult = SignInSchema.safeParse(req);

    if (!parsedResult.success) {
      throw APIError.invalidArgument(
        `Invalid request: \n${parsedResult.error.issues}`
      );
    }

    const { email, password } = parsedResult.data;

    const { user, token } = await AuthService.login({ email, password });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      session: {
        token: token,
        expiredAt: new Date(Date.now() + 60 * 60 * 24 * 7 * 1000), // 7 days from now
      },
    };
  }
);
