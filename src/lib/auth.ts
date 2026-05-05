import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scrypt = promisify(scryptCallback);

export const sessionCookieName = "confeitaria_session";
export const sessionMaxAgeSeconds = 60 * 60 * 24 * 7;

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "ATTENDANT";
  storeId: string;
  storeSlug: string;
  storeName: string;
};

export class AuthValidationError extends Error {
  constructor(public readonly issues: string[]) {
    super(issues.join(" "));
    this.name = "AuthValidationError";
  }
}

export function normalizeEmail(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function makeSlug(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export function validateRegisterPayload(payload: unknown) {
  const data = payload && typeof payload === "object" ? payload : {};
  const record = data as Record<string, unknown>;
  const storeName = normalizeText(record.storeName);
  const name = normalizeText(record.name);
  const email = normalizeEmail(record.email);
  const password = normalizeText(record.password);
  const issues: string[] = [];

  if (storeName.length < 2) issues.push("Informe o nome da loja.");
  if (name.length < 2) issues.push("Informe seu nome.");
  if (!email.includes("@") || email.length < 6) issues.push("Informe um e-mail válido.");
  if (password.length < 8) issues.push("A senha precisa ter pelo menos 8 caracteres.");

  if (issues.length > 0) throw new AuthValidationError(issues);

  return {
    storeName,
    storeSlug: makeSlug(storeName) || `loja-${Date.now()}`,
    name,
    email,
    password
  };
}

export function validateLoginPayload(payload: unknown) {
  const data = payload && typeof payload === "object" ? payload : {};
  const record = data as Record<string, unknown>;
  const email = normalizeEmail(record.email);
  const password = normalizeText(record.password);
  const issues: string[] = [];

  if (!email.includes("@") || email.length < 6) issues.push("Informe um e-mail válido.");
  if (password.length < 1) issues.push("Informe a senha.");

  if (issues.length > 0) throw new AuthValidationError(issues);

  return {
    email,
    password
  };
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = (await scrypt(password, salt, 64)) as Buffer;

  return `${salt}:${derivedKey.toString("hex")}`;
}

export async function verifyPassword(password: string, storedHash: string) {
  const [salt, key] = storedHash.split(":");
  if (!salt || !key) return false;

  const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
  const storedKey = Buffer.from(key, "hex");

  if (storedKey.length !== derivedKey.length) return false;

  return timingSafeEqual(storedKey, derivedKey);
}

export function createSessionToken() {
  return randomBytes(32).toString("hex");
}

export function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function getSessionExpirationDate() {
  return new Date(Date.now() + sessionMaxAgeSeconds * 1000);
}
