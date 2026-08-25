import { headers } from "next/headers";
import { ensureTables, getRuntimeEnv } from "./api/_shared";

export type SessionUser = {
  id: string;
  username: string;
  displayName: string;
  role: "admin" | "member";
};

const SESSION_COOKIE = "anna_result_session";

function bytesToBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlToBytes(value: string) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((value.length + 3) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function digest(value: string) {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return bytesToBase64Url(new Uint8Array(hash));
}

function cookieValue(cookieHeader: string | null, name: string) {
  const match = cookieHeader?.split(";").map((item) => item.trim()).find((item) => item.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : "";
}

export function normalizeUsername(value: string) {
  return value.trim().toLowerCase();
}

export async function hashPassword(password: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const material = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  // Cloudflare Workers currently caps WebCrypto PBKDF2 at 100,000 iterations.
  const iterations = 100_000;
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations }, material, 256);
  return `pbkdf2_sha256$${iterations}$${bytesToBase64Url(salt)}$${bytesToBase64Url(new Uint8Array(bits))}`;
}

export async function verifyPassword(password: string, encoded: string) {
  const [algorithm, iterationValue, saltValue, expectedValue] = encoded.split("$");
  const iterations = Number(iterationValue);
  if (algorithm !== "pbkdf2_sha256" || !iterations || iterations > 100_000 || !saltValue || !expectedValue) return false;
  const material = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: base64UrlToBytes(saltValue), iterations }, material, 256);
  const actual = bytesToBase64Url(new Uint8Array(bits));
  if (actual.length !== expectedValue.length) return false;
  let difference = 0;
  for (let index = 0; index < actual.length; index++) difference |= actual.charCodeAt(index) ^ expectedValue.charCodeAt(index);
  return difference === 0;
}

export async function getSessionUserFromRequest(request: Request): Promise<SessionUser | null> {
  await ensureTables();
  const token = cookieValue(request.headers.get("cookie"), SESSION_COOKIE);
  if (!token) return null;
  const { DB } = await getRuntimeEnv();
  const row = await DB.prepare(`SELECT u.id, u.username, u.display_name, u.role
    FROM auth_sessions s JOIN users u ON u.id = s.user_id
    WHERE s.token_hash = ? AND s.expires_at > CURRENT_TIMESTAMP AND u.active = 1`)
    .bind(await digest(token)).first<{ id: string; username: string; display_name: string; role: "admin" | "member" }>();
  return row ? { id: row.id, username: row.username, displayName: row.display_name, role: row.role } : null;
}

export async function getCurrentSessionUser() {
  const requestHeaders = await headers();
  return getSessionUserFromRequest(new Request("https://app.local/", { headers: requestHeaders }));
}

export async function createSession(userId: string, request: Request) {
  const token = bytesToBase64Url(crypto.getRandomValues(new Uint8Array(32)));
  const { DB } = await getRuntimeEnv();
  await DB.prepare(`INSERT INTO auth_sessions (token_hash, user_id, expires_at, created_at)
    VALUES (?, ?, datetime('now', '+30 days'), CURRENT_TIMESTAMP)`).bind(await digest(token), userId).run();
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000${secure}`;
}

export async function destroySession(request: Request) {
  const token = cookieValue(request.headers.get("cookie"), SESSION_COOKIE);
  if (token) {
    const { DB } = await getRuntimeEnv();
    await DB.prepare("DELETE FROM auth_sessions WHERE token_hash = ?").bind(await digest(token)).run();
  }
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`;
}
