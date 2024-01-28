import { SetMetadata } from "@nestjs/common";

export const REQUIRE_SESSION_AUTH_KEY = "session-auth-requirement";
export const RequireSessionAuth = () =>
  SetMetadata(REQUIRE_SESSION_AUTH_KEY, true);
