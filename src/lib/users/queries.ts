import crypto from "crypto";
import bcrypt from "bcryptjs";
import { authQuery } from "@/lib/db/pools";
import type { UserType } from "@/lib/projects/access";
import {
  parseUserNavPermissions,
  sanitizeNavPermissionsForRole,
} from "@/lib/users/nav-permissions";
import type {
  CreateHubUserInput,
  HubUser,
  UpdateHubUserInput,
} from "@/lib/users/types";

type UserRow = {
  id: string;
  email: string;
  user_type: UserType;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
  nav_permissions_json?: unknown;
};

const USER_SELECT = `id, email, user_type, is_active, last_login_at, created_at, updated_at, nav_permissions_json`;

function mapUser(row: UserRow): HubUser {
  return {
    id: row.id,
    email: row.email,
    userType: row.user_type,
    isActive: row.is_active,
    lastLoginAt: row.last_login_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    navPermissions: parseUserNavPermissions(row.nav_permissions_json),
  };
}

export async function listHubUsers(): Promise<HubUser[]> {
  const { rows } = await authQuery<UserRow>(
    `SELECT ${USER_SELECT}
     FROM users
     ORDER BY created_at DESC`,
  );
  return rows.map(mapUser);
}

export async function getHubUserById(id: string): Promise<HubUser | null> {
  const { rows } = await authQuery<UserRow>(
    `SELECT ${USER_SELECT}
     FROM users
     WHERE id = $1
     LIMIT 1`,
    [id],
  );
  return rows[0] ? mapUser(rows[0]) : null;
}

export async function createHubUser(input: CreateHubUserInput): Promise<HubUser> {
  const email = input.email.trim().toLowerCase();
  const passwordHash = await bcrypt.hash(input.password, 12);
  const id = crypto.randomUUID();
  const isActive = input.isActive ?? true;
  const navPermissions = sanitizeNavPermissionsForRole(
    input.userType,
    input.navPermissions ?? {},
  );

  const { rows } = await authQuery<UserRow>(
    `INSERT INTO users (id, email, password_hash, user_type, is_active, nav_permissions_json, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6::jsonb, NOW(), NOW())
     RETURNING ${USER_SELECT}`,
    [id, email, passwordHash, input.userType, isActive, JSON.stringify(navPermissions)],
  );

  const row = rows[0];
  if (!row) {
    throw new Error("Failed to create user.");
  }

  return mapUser(row);
}

export async function updateHubUser(
  id: string,
  input: UpdateHubUserInput,
): Promise<HubUser> {
  const current = await getHubUserById(id);
  if (!current) {
    throw new Error("User not found.");
  }

  const userType = input.userType ?? current.userType;
  const isActive = input.isActive ?? current.isActive;
  const navPermissions = input.navPermissions ?? current.navPermissions;

  const { rows } = await authQuery<UserRow>(
    `UPDATE users
     SET user_type = $1,
         is_active = $2,
         nav_permissions_json = $3::jsonb,
         updated_at = NOW()
     WHERE id = $4
     RETURNING ${USER_SELECT}`,
    [userType, isActive, JSON.stringify(navPermissions), id],
  );

  const row = rows[0];
  if (!row) {
    throw new Error("Failed to update user.");
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

export async function deleteHubUser(id: string): Promise<void> {
  const { rowCount } = await authQuery(
    `DELETE FROM users WHERE id = $1`,
    [id],
  );
  if (!rowCount) {
    throw new Error("User not found.");
  }
}
