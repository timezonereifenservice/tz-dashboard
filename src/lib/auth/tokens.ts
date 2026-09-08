import crypto from "crypto";
import jwt, { type JwtPayload } from "jsonwebtoken";
import {
  ACCESS_TOKEN_TTL_SECONDS,
  REFRESH_TOKEN_TTL_SECONDS,
} from "@/lib/auth/config";

export type AccessTokenPayload = {
  sub: string;
  email: string;
  userType: string;
  sessionId: string;
  jti: string;
};

type RefreshTokenPayload = {
  sub: string;
  sessionId: string;
  jti: string;
};

function getAccessSecret() {
  const secret = process.env.AUTH_JWT_SECRET;
  if (!secret) throw new Error("Missing AUTH_JWT_SECRET");
  return secret;
}

function getRefreshSecret() {
  const secret = process.env.AUTH_REFRESH_SECRET;
  if (!secret) throw new Error("Missing AUTH_REFRESH_SECRET");
  return secret;
}

export function createAccessToken(payload: Omit<AccessTokenPayload, "jti">) {
  const jti = crypto.randomUUID();
  const token = jwt.sign({ ...payload, jti }, getAccessSecret(), {
    algorithm: "HS256",
    expiresIn: ACCESS_TOKEN_TTL_SECONDS,
  });
  return { token, jti };
}

export function createRefreshToken(payload: Omit<RefreshTokenPayload, "jti">) {
  const jti = crypto.randomUUID();
  const token = jwt.sign({ ...payload, jti }, getRefreshSecret(), {
    algorithm: "HS256",
    expiresIn: REFRESH_TOKEN_TTL_SECONDS,
  });
  return { token, jti };
}

export function verifyAccessToken(
  token: string,
): (JwtPayload & Partial<AccessTokenPayload>) | null {
  try {
    return jwt.verify(token, getAccessSecret()) as JwtPayload;
  } catch {
    return null;
  }
}
