import crypto from "crypto";
import bcrypt from "bcryptjs";
import { authQuery } from "@/lib/db/pools";
import type { UserType } from "@/lib/projects/access";
import type { CreateHubUserInput, HubUser } from "@/lib/users/types";

type UserRow = {
  id: string;
  email: string;
  user_type: UserType;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
};

function mapUser(row: UserRow): HubUser {
  return {
    id: row.id,
    email: row.email,
    userType: row.user_type,
    isActive: row.is_active,
    lastLoginAt: row.last_login_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listHubUsers(): Promise<HubUser[]> {
  const { rows } = await authQuery<UserRow>(
    `SELECT id, email, user_type, is_active, last_login_at, created_at, updated_at
     FROM users
     ORDER BY created_at DESC`,
  );
  return rows.map(mapUser);
}

export async function createHubUser(input: CreateHubUserInput): Promise<HubUser> {
  const email = input.email.trim().toLowerCase();
  const passwordHash = await bcrypt.hash(input.password, 12);
  const id = crypto.randomUUID();
  const isActive = input.isActive ?? true;

  const { rows } = await authQuery<UserRow>(
    `INSERT INTO users (id, email, password_hash, user_type, is_active, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
     RETURNING id, email, user_type, is_active, last_login_at, created_at, updated_at`,
    [id, email, passwordHash, input.userType, isActive],
  );

  const row = rows[0];
  if (!row) {
    throw new Error("Failed to create user.");
  }

  return mapUser(row);
}

export async function hubUserEmailExists(email: string): Promise<boolean> {
  const { rows } = await authQuery<{ id: string }>(
    `SELECT id FROM users WHERE email = $1 LIMIT 1`,
    [email.trim().toLowerCase()],
  );
  return Boolean(rows[0]);
}
