import { Header } from "encore.dev/api";

export interface AuthParams {
  authorization: Header<"Authorization">;
}

export interface AuthData {
  userID: string;
  email: string;
  name: string;
}

export interface SignUpDTO {
  email: string;
  name: string;
  password: string;
  confirmPassword: string;
}

export interface SignInDTO {
  email: string;
  password: string;
}
