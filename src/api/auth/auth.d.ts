import type { AuthData } from "./auth.interface";

declare module "~encore/auth" {
  export function getAuthData(): AuthData;
}
